const express = require('express');
const router = express.Router();
const cashHandlingController = require('../controllers/cashHandling.controller');
const auth = require('../middleware/auth');
const { isAdmin, isWorker } = require('../middleware/roles');

// Cash shortage routes
router.post('/shortage/report', auth, isWorker, cashHandlingController.reportShortage);
router.put('/shortage/:shortageId/resolve', auth, isAdmin, cashHandlingController.resolveShortage);
router.get('/shortage/worker', auth, isWorker, cashHandlingController.getWorkerShortages);

// Cash guidelines routes
router.post('/guidelines', auth, isAdmin, cashHandlingController.createGuideline);
router.get('/guidelines', auth, cashHandlingController.getGuidelines);
router.post('/guidelines/:guidelineId/acknowledge', auth, isWorker, cashHandlingController.acknowledgeGuideline);

module.exports = router;
