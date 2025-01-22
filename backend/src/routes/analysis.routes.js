const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis.controller');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

// Apply auth and admin middleware to all routes
router.use(auth, isAdmin);

// Shortage analysis routes
router.get('/shortages', analysisController.getShortageAnalysis);

// Worker performance routes
router.get('/performance', analysisController.getWorkerPerformance);
router.get('/performance/:workerId', analysisController.getWorkerMetrics);

// Export download route
router.get('/download/:fileName', analysisController.downloadReport);

module.exports = router;
