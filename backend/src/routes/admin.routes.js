const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

// Apply auth and admin middleware to all routes
router.use(auth, isAdmin);

// Dashboard statistics
router.get('/dashboard/stats', adminController.getDashboardStats);

// Weekly orders statistics
router.get('/dashboard/weekly-orders', adminController.getWeeklyOrdersStats);

// Worker performance statistics
router.get('/workers/stats', adminController.getWorkerStats);

// Customer insights
router.get('/customers/insights', adminController.getCustomerInsights);

// Inventory status
router.get('/inventory/status', adminController.getInventoryStatus);

module.exports = router;
