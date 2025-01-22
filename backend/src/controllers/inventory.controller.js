const InventoryService = require('../services/inventory.service');
const { catchAsync } = require('../utils/error.util');

exports.adjustStock = catchAsync(async (req, res) => {
  const { productId, quantity, type, reason, reference, referenceId, referenceModel, notes } = req.body;
  const transaction = await InventoryService.adjustStock(
    productId,
    quantity,
    type,
    reason,
    reference,
    referenceId,
    referenceModel,
    req.user._id,
    notes
  );

  res.status(200).json({
    success: true,
    message: 'تم تحديث المخزون بنجاح',
    data: transaction
  });
});

exports.createProduction = catchAsync(async (req, res) => {
  const production = await InventoryService.createProduction({
    ...req.body,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الإنتاج بنجاح',
    data: production
  });
});

exports.updateProductionStatus = catchAsync(async (req, res) => {
  const { status, completionDate } = req.body;
  const production = await InventoryService.updateProductionStatus(
    req.params.id,
    status,
    completionDate
  );

  res.status(200).json({
    success: true,
    message: 'تم تحديث حالة الإنتاج بنجاح',
    data: production
  });
});

exports.createStockCount = catchAsync(async (req, res) => {
  const stockCount = await InventoryService.createStockCount({
    ...req.body,
    countedBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الجرد بنجاح',
    data: stockCount
  });
});

exports.approveStockCount = catchAsync(async (req, res) => {
  const stockCount = await InventoryService.approveStockCount(
    req.params.id,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: 'تم اعتماد الجرد بنجاح',
    data: stockCount
  });
});

exports.getInventoryReport = catchAsync(async (req, res) => {
  const report = await InventoryService.getInventoryReport(req.query);

  res.status(200).json({
    success: true,
    data: report
  });
});

exports.getTransactionHistory = catchAsync(async (req, res) => {
  const { productId, startDate, endDate } = req.query;
  const transactions = await InventoryService.getTransactionHistory(
    productId,
    startDate,
    endDate
  );

  res.status(200).json({
    success: true,
    data: transactions
  });
});
