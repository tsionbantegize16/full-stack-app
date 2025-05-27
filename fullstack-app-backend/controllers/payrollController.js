const payrollService = require('../services/payrollService');

// Define the fixed period for the assignment (April 2025)
const ASSIGNMENT_START_DATE = '2025-04-01';
const ASSIGNMENT_END_DATE = '2025-04-30';

/**
 * GET /api/payroll/general-laborers
 * Retrieves payroll details for all General Laborers for April 2025.
 */
async function getGeneralLaborerPayroll(req, res) {
    try {
        const data = await payrollService.getGeneralLaborerPayrollDetails(
            ASSIGNMENT_START_DATE,
            ASSIGNMENT_END_DATE
        );
        res.json({
            message: `General Laborer Payroll for ${ASSIGNMENT_START_DATE} to ${ASSIGNMENT_END_DATE}`,
            data: data
        });
    } catch (error) {
        console.error('Error in getGeneralLaborerPayroll controller:', error);
        res.status(500).json({ error: 'Failed to retrieve general laborer payroll.' });
    }
}

/**
 * GET /api/reports/subcity-payments
 * Generates a report showing payments and totals grouped by SubCity for April 2025.
 */
async function getSubCityPaymentsReport(req, res) {
    try {
        const data = await payrollService.generateSubCityPaymentsReport(
            ASSIGNMENT_START_DATE,
            ASSIGNMENT_END_DATE
        );
        res.json({
            message: `Employee Payments by SubCity Report for ${ASSIGNMENT_START_DATE} to ${ASSIGNMENT_END_DATE}`,
            data: data
        });
    } catch (error) {
        console.error('Error in getSubCityPaymentsReport controller:', error);
        res.status(500).json({ error: 'Failed to generate SubCity payments report.' });
    }
}

module.exports = {
    getGeneralLaborerPayroll,
    getSubCityPaymentsReport
}; 