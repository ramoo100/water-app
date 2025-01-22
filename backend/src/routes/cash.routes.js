const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cash.controller');
const auth = require('../middleware/auth');
const { isAdmin, isWorker } = require('../middleware/roles');

// Worker routes
router.get('/worker/daily', auth, isWorker, cashController.getWorkerDailyCash);
router.get('/worker/history', auth, isWorker, cashController.getWorkerCashHistory);

// Admin routes
router.get('/admin/report', auth, isAdmin, cashController.getAdminCashReport);
router.get('/admin/reconciliation', auth, isAdmin, cashController.getDailyCashReconciliation);

module.exports = router;
