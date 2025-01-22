const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const inventoryController = require('../controllers/inventory.controller');

const router = express.Router();

// حماية جميع المسارات
router.use(protect);

// مسارات المخزون
router.post(
  '/adjust',
  restrictTo('admin', 'inventory_manager'),
  inventoryController.adjustStock
);

router.get(
  '/report',
  restrictTo('admin', 'inventory_manager', 'supervisor'),
  inventoryController.getInventoryReport
);

router.get(
  '/transactions',
  restrictTo('admin', 'inventory_manager', 'supervisor'),
  inventoryController.getTransactionHistory
);

// مسارات الإنتاج
router.post(
  '/production',
  restrictTo('admin', 'production_manager'),
  inventoryController.createProduction
);

router.patch(
  '/production/:id',
  restrictTo('admin', 'production_manager'),
  inventoryController.updateProductionStatus
);

// مسارات الجرد
router.post(
  '/count',
  restrictTo('admin', 'inventory_manager'),
  inventoryController.createStockCount
);

router.patch(
  '/count/:id/approve',
  restrictTo('admin'),
  inventoryController.approveStockCount
);

module.exports = router;
