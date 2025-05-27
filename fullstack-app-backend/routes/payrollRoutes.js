const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');

// Route to get payroll details for general laborers
router.get('/general-laborers', payrollController.getGeneralLaborerPayroll);

// Route to get the SubCity payments report
router.get('/subcity-payments', payrollController.getSubCityPaymentsReport);

module.exports = router; 