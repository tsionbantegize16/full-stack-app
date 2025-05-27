const pool = require('./db');
require('dotenv').config();
const { parse } = require('date-fns');

async function initializeDatabase() {
    console.log('Initializing database...');
    try {
        // Create tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pay_rates (
                level VARCHAR(10) PRIMARY KEY,
                job_title VARCHAR(50) NOT NULL,
                wage_per_hour NUMERIC(10, 2) NOT NULL
            );
        `);
        console.log('Table "pay_rates" created or already exists.');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS employees (
                employee_id SERIAL PRIMARY KEY,
                level VARCHAR(10) NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                phone_number VARCHAR(20),
                sub_city VARCHAR(50),
                FOREIGN KEY (level) REFERENCES pay_rates(level)
            );
        `);
        console.log('Table "employees" created or already exists.');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS hours_worked (
                work_id SERIAL PRIMARY KEY,
                employee_id INTEGER NOT NULL,
                work_date DATE NOT NULL,
                start_time TIME NOT NULL,
                finish_time TIME NOT NULL,
                FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
            );
        `);
        console.log('Table "hours_worked" created or already exists.');

        // Insert Pay Rates (ON CONFLICT DO NOTHING to prevent duplicates)
        await pool.query(`
            INSERT INTO pay_rates (level, job_title, wage_per_hour) VALUES
            ('L13', 'Project manager', 200),
            ('L14', 'Construction foreman', 150),
            ('L15', 'Electrician', 120),
            ('L16', 'Ironworker', 100),
            ('L17', 'Joiner', 90),
            ('L18', 'General laborer', 50)
            ON CONFLICT (level) DO NOTHING;
        `);
        console.log('Pay rates inserted or already exist.');

        // Insert 15 Employees
        const employeeData = [
            { level: 'L13', firstName: 'John', lastName: 'Doe', phone: '0911234567', subCity: 'Bole' }, // PM
            { level: 'L14', firstName: 'Jane', lastName: 'Smith', phone: '0912345678', subCity: 'Arada' }, // CF
            { level: 'L15', firstName: 'Peter', lastName: 'Jones', phone: '0913456789', subCity: 'Kirkos' }, // Elec
            { level: 'L16', firstName: 'Aisha', lastName: 'Ahmed', phone: '0914567890', subCity: 'Nifas Silk' }, // Iron 1
            { level: 'L16', firstName: 'Mohammed', lastName: 'Ali', phone: '0915678901', subCity: 'Bole' }, // Iron 2
            { level: 'L16', firstName: 'Fatima', lastName: 'Omar', phone: '0916789012', subCity: 'Arada' }, // Iron 3
            { level: 'L17', firstName: 'Bereket', lastName: 'Lemma', phone: '0917890123', subCity: 'Kirkos' }, // Join 1
            { level: 'L17', firstName: 'Chaltu', lastName: 'Abebe', phone: '0918901234', subCity: 'Nifas Silk' }, // Join 2
            { level: 'L17', firstName: 'Daniel', lastName: 'Tesfaye', phone: '0919012345', subCity: 'Bole' }, // Join 3
            { level: 'L18', firstName: 'Worku', lastName: 'Kebede', phone: '0920123456', subCity: 'Akaki Kality' }, // GL 1
            { level: 'L18', firstName: 'Genet', lastName: 'Fantu', phone: '0921234567', subCity: 'Kolfe Keranio' }, // GL 2
            { level: 'L18', firstName: 'Solomon', lastName: 'Lemma', phone: '0922345678', subCity: 'Gullele' }, // GL 3
            { level: 'L18', firstName: 'Kedir', lastName: 'Ali', phone: '0923456789', subCity: 'Yeka' }, // GL 4
            { level: 'L18', firstName: 'Fetle', lastName: 'Desta', phone: '0924567890', subCity: 'Lideta' }, // GL 5
            { level: 'L18', firstName: 'Tola', lastName: 'Gudeta', phone: '0925678901', subCity: 'Bole' } // GL 6
        ];

        const employeeIds = {}; // To store inserted employee_ids
        for (const data of employeeData) {
            const res = await pool.query(
                `INSERT INTO employees (level, first_name, last_name, phone_number, sub_city)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT DO NOTHING RETURNING employee_id;`,
                [data.level, data.firstName, data.lastName, data.phone, data.subCity]
            );
            if (res.rows.length > 0) {
                employeeIds[`${data.firstName} ${data.lastName}`] = res.rows[0].employee_id;
            } else {
                // If it already exists, fetch its ID
                const existingEmp = await pool.query(
                    `SELECT employee_id FROM employees WHERE first_name = $1 AND last_name = $2;`,
                    [data.firstName, data.lastName]
                );
                if (existingEmp.rows.length > 0) {
                    employeeIds[`${data.firstName} ${data.lastName}`] = existingEmp.rows[0].employee_id;
                }
            }
        }
        console.log('Employees inserted or already exist.');

        // Helper to insert hours, checking for duplicates
        const insertHoursIfNotExist = async (empId, dateStr, startTimeStr, finishTimeStr) => {
            const workDate = parse(dateStr, 'yyyy-MM-dd', new Date());
            const startTime = parse(startTimeStr, 'HH:mm', new Date());
            const finishTime = parse(finishTimeStr, 'HH:mm', new Date());

            if (!empId) {
                console.warn(`Skipping hours for unknown employee ID for date ${dateStr}.`);
                return;
            }

            const checkQuery = `SELECT 1 FROM hours_worked WHERE employee_id = $1 AND work_date = $2 AND start_time = $3 AND finish_time = $4;`;
            const checkRes = await pool.query(checkQuery, [empId, workDate, startTime.toTimeString().substring(0,8), finishTime.toTimeString().substring(0,8)]);

            if (checkRes.rows.length === 0) {
                await pool.query(
                    `INSERT INTO hours_worked (employee_id, work_date, start_time, finish_time)
                     VALUES ($1, $2, $3, $4);`,
                    [empId, workDate, startTime.toTimeString().substring(0,8), finishTime.toTimeString().substring(0,8)]
                );
            }
        };

        // Project Manager (2 records)
        await insertHoursIfNotExist(employeeIds['John Doe'], '2025-04-01', '08:00', '17:00');
        await insertHoursIfNotExist(employeeIds['John Doe'], '2025-04-02', '08:30', '17:30');
        // Construction Foreman (2 records)
        await insertHoursIfNotExist(employeeIds['Jane Smith'], '2025-04-01', '07:00', '16:00');
        await insertHoursIfNotExist(employeeIds['Jane Smith'], '2025-04-03', '07:30', '16:30');
        // Electrician (1 record)
        await insertHoursIfNotExist(employeeIds['Peter Jones'], '2025-04-01', '08:00', '17:00');
        // Ironworkers (1 record each)
        await insertHoursIfNotExist(employeeIds['Aisha Ahmed'], '2025-04-01', '08:00', '17:00');
        await insertHoursIfNotExist(employeeIds['Mohammed Ali'], '2025-04-02', '08:00', '17:00');
        await insertHoursIfNotExist(employeeIds['Fatima Omar'], '2025-04-03', '08:00', '17:00');
        // Joiners (1 record each)
        await insertHoursIfNotExist(employeeIds['Bereket Lemma'], '2025-04-04', '08:00', '17:00');
        await insertHoursIfNotExist(employeeIds['Chaltu Abebe'], '2025-04-05', '08:00', '17:00');
        await insertHoursIfNotExist(employeeIds['Daniel Tesfaye'], '2025-04-06', '08:00', '17:00');
        // General Laborers (3 records each)
        const glNames = ['Worku Kebede', 'Genet Fantu', 'Solomon Lemma', 'Kedir Ali', 'Fetle Desta', 'Tola Gudeta'];
        for (const glName of glNames) {
            const glId = employeeIds[glName];
            await insertHoursIfNotExist(glId, '2025-04-01', '08:00', '17:00');
            await insertHoursIfNotExist(glId, '2025-04-02', '08:00', '17:00');
            await insertHoursIfNotExist(glId, '2025-04-03', '08:00', '17:00');
        }

        console.log('Hours worked inserted or already exist.');

    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        pool.end(); // Close the pool after initialization
        console.log('Database initialization complete. Pool closed.');
    }
}

initializeDatabase(); 