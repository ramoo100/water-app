const CashShortage = require('../models/cashShortage.model');
const CashGuideline = require('../models/cashGuideline.model');
const NotificationService = require('../services/notification.service');

// Report cash shortage
exports.reportShortage = async (req, res) => {
  try {
    const {
      expectedAmount,
      actualAmount,
      reason,
      relatedOrders,
      notes
    } = req.body;

    const shortage = new CashShortage({
      worker: req.user._id,
      date: new Date(),
      expectedAmount,
      actualAmount,
      reason,
      relatedOrders,
      notes
    });

    await shortage.save();

    // Notify admin about the shortage
    NotificationService.notifyAdmins('CASH_SHORTAGE_REPORTED', {
      workerId: req.user._id,
      workerName: req.user.name,
      shortageAmount: shortage.shortageAmount,
      reason: shortage.reason
    });

    res.status(201).json({
      success: true,
      message: 'تم تسجيل النقص في التحصيل',
      shortage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في تسجيل النقص',
      error: error.message
    });
  }
};

// Resolve cash shortage
exports.resolveShortage = async (req, res) => {
  try {
    const { shortageId } = req.params;
    const { resolution, notes } = req.body;

    const shortage = await CashShortage.findById(shortageId);
    if (!shortage) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على النقص المطلوب'
      });
    }

    shortage.status = 'resolved';
    shortage.resolution = resolution;
    shortage.resolvedBy = req.user._id;
    shortage.resolvedAt = new Date();
    shortage.notes = notes;

    await shortage.save();

    // Notify worker about resolution
    NotificationService.sendNotification(
      shortage.worker,
      'worker',
      'SHORTAGE_RESOLVED',
      {
        shortageId: shortage._id,
        resolution,
        resolvedBy: req.user.name
      }
    );

    res.json({
      success: true,
      message: 'تم حل مشكلة النقص',
      shortage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في حل مشكلة النقص',
      error: error.message
    });
  }
};

// Get worker's shortages
exports.getWorkerShortages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const query = { worker: req.user._id };
    if (status) {
      query.status = status;
    }

    const shortages = await CashShortage.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('resolvedBy', 'name');

    const total = await CashShortage.countDocuments(query);

    res.json({
      success: true,
      shortages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب سجل النقص',
      error: error.message
    });
  }
};

// Create cash guideline
exports.createGuideline = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      acknowledgmentRequired
    } = req.body;

    const guideline = new CashGuideline({
      title,
      description,
      category,
      priority,
      acknowledgmentRequired,
      createdBy: req.user._id
    });

    await guideline.save();

    // Notify all workers about new guideline
    if (acknowledgmentRequired) {
      NotificationService.notifyWorkers('NEW_GUIDELINE', {
        guidelineId: guideline._id,
        title: guideline.title,
        priority: guideline.priority
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الإرشادات بنجاح',
      guideline
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء الإرشادات',
      error: error.message
    });
  }
};

// Get cash guidelines
exports.getGuidelines = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }

    const guidelines = await CashGuideline.find(query)
      .sort('-priority')
      .populate('createdBy', 'name');

    // If worker, check acknowledgments
    if (req.user.role === 'worker') {
      guidelines.forEach(guideline => {
        guideline._doc.isAcknowledged = guideline.acknowledgments.some(
          ack => ack.worker.toString() === req.user._id.toString()
        );
      });
    }

    res.json({
      success: true,
      guidelines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب الإرشادات',
      error: error.message
    });
  }
};

// Acknowledge guideline
exports.acknowledgeGuideline = async (req, res) => {
  try {
    const { guidelineId } = req.params;

    const guideline = await CashGuideline.findById(guidelineId);
    if (!guideline) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الإرشادات'
      });
    }

    if (!guideline.acknowledgmentRequired) {
      return res.status(400).json({
        success: false,
        message: 'لا يتطلب هذا الإرشاد تأكيداً'
      });
    }

    // Check if already acknowledged
    const alreadyAcknowledged = guideline.acknowledgments.some(
      ack => ack.worker.toString() === req.user._id.toString()
    );

    if (alreadyAcknowledged) {
      return res.status(400).json({
        success: false,
        message: 'تم تأكيد هذا الإرشاد مسبقاً'
      });
    }

    guideline.acknowledgments.push({
      worker: req.user._id,
      acknowledgedAt: new Date()
    });

    await guideline.save();

    res.json({
      success: true,
      message: 'تم تأكيد الإرشاد بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في تأكيد الإرشاد',
      error: error.message
    });
  }
};
