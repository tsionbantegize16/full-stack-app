const pool = require('../db/db');
const { calculateHoursDiff } = require('../utils/helpers');
require('dotenv').config(); // For TAX_RATE

const TAX_RATE = parseFloat(process.env.TAX_RATE || 0.25);

/**
 * Retrieves raw hours worked and wage per hour for a specific employee
 * within a given date range.
 * @param {number} employeeId
 * @param {string} startDate - 'YYYY-MM-DD'
 * @param {string} endDate - 'YYYY-MM-DD'
 * @returns {Array<Object>} List of objects: {start_time, finish_time, wage_per_hour}
 */
async function getEmployeeWorkRecords(employeeId, startDate, endDate) {
    try {
        const result = await pool.query(
            `SELECT
                hw.start_time, hw.finish_time, pr.wage_per_hour
            FROM
                hours_worked hw
            JOIN
                employees e ON hw.employee_id = e.employee_id
            JOIN
                pay_rates pr ON e.level = pr.level
            WHERE
                e.employee_id = $1 AND hw.work_date BETWEEN $2 AND $3;`,
            [employeeId, startDate, endDate]
        );
        return result.rows;
    } catch (error) {
        console.error(`Error fetching work records for employee ${employeeId}:`, error);
        throw error;
    }
}

/**
 * Calculates total hours, total pay, and tax for a single employee.
 * @param {number} employeeId
 * @param {string} startDate - 'YYYY-MM-DD'
 * @param {string} endDate - 'YYYY-MM-DD'
 * @returns {Object} {employee_id, total_hours, total_pay, tax}
 */
async function calculateEmployeePayroll(employeeId, startDate, endDate) {
    const records = await getEmployeeWorkRecords(employeeId, startDate, endDate);

    let totalHours = 0;
    let wagePerHour = 0;

    if (records.length === 0) {
        return {
            employee_id: employeeId,
            total_hours: 0,
            total_pay: 0,
            tax: 0
        };
    }

    // Iterate through records to sum hours and get wage (assuming wage is constant for the period)
    for (const record of records) {
        // Convert PostgreSQL TIME objects (which might come as Date objects with dummy date)
        // or directly as strings from the DB, then extract HH:mm
        const startTimeStr = record.start_time instanceof Date ? record.start_time.toTimeString().substring(0, 5) : record.start_time;
        const finishTimeStr = record.finish_time instanceof Date ? record.finish_time.toTimeString().substring(0, 5) : record.finish_time;

        totalHours += calculateHoursDiff(startTimeStr, finishTimeStr);
        wagePerHour = parseFloat(record.wage_per_hour); // Convert NUMERIC to float
    }

    const totalPay = totalHours * wagePerHour;
    const tax = totalPay * TAX_RATE;

    return {
        employee_id: employeeId,
        total_hours: parseFloat(totalHours.toFixed(2)),
        total_pay: parseFloat(totalPay.toFixed(2)),
        tax: parseFloat(tax.toFixed(2))
    };
}

/**
 * Retrieves payroll details for all General Laborers ('L18') within a date range.
 * @param {string} startDate - 'YYYY-MM-DD'
 * @param {string} endDate - 'YYYY-MM-DD'
 * @returns {Array<Object>} List of payroll details for general laborers.
 */
async function getGeneralLaborerPayrollDetails(startDate, endDate) {
    try {
        const result = await pool.query(
            `SELECT employee_id, first_name, last_name FROM employees WHERE level = 'L18';`
        );
        const laborers = result.rows;

        const payrollDetails = [];
        for (const laborer of laborers) {
            const payroll = await calculateEmployeePayroll(laborer.employee_id, startDate, endDate);
            payrollDetails.push({
                EmployeeID: laborer.employee_id,
                FirstName: laborer.first_name,
                LastName: laborer.last_name,
                TotalHours: payroll.total_hours,
                TotalPay: payroll.total_pay,
                Tax: payroll.tax
            });
        }
        return payrollDetails;
    } catch (error) {
        console.error('Error fetching general laborer payroll:', error);
        throw error;
    }
}

/**
 * Generates aggregated payments and totals by SubCity.
 * @param {string} startDate - 'YYYY-MM-DD'
 * @param {string} endDate - 'YYYY-MM-DD'
 * @returns {Object} Aggregated data grouped by SubCity.
 */
async function generateSubCityPaymentsReport(startDate, endDate) {
    try {
        const result = await pool.query(
            `SELECT employee_id, first_name, last_name, sub_city, level FROM employees;`
        );
        const allEmployees = result.rows;

        const subCityData = {};

        for (const employee of allEmployees) {
            const payroll = await calculateEmployeePayroll(employee.employee_id, startDate, endDate);

            if (!subCityData[employee.sub_city]) {
                subCityData[employee.sub_city] = {
                    total_pay: 0,
                    total_tax: 0,
                    employees: []
                };
            }

            subCityData[employee.sub_city].total_pay += payroll.total_pay;
            subCityData[employee.sub_city].total_tax += payroll.tax;
            subCityData[employee.sub_city].employees.push({
                id: employee.employee_id,
                name: `${employee.first_name} ${employee.last_name}`,
                level: employee.level,
                total_pay: payroll.total_pay,
                tax: payroll.tax
            });
        }
        return subCityData;
    } catch (error) {
        console.error('Error generating SubCity payments report:', error);
        throw error;
    }
}

module.exports = {
    getGeneralLaborerPayrollDetails,
    generateSubCityPaymentsReport
}; 