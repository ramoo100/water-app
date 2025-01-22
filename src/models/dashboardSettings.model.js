const mongoose = require('mongoose');

const widgetSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['stats', 'chart', 'list', 'map', 'calendar', 'custom'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  position: {
    row: Number,
    column: Number,
    size: {
      width: Number,
      height: Number
    }
  },
  refreshInterval: {
    type: Number,
    default: 300 // 5 minutes in seconds
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const themeSchema = new mongoose.Schema({
  primaryColor: {
    type: String,
    default: '#2196F3'
  },
  secondaryColor: {
    type: String,
    default: '#FF9800'
  },
  backgroundColor: {
    type: String,
    default: '#f5f5f5'
  },
  cardColor: {
    type: String,
    default: '#ffffff'
  },
  textColor: {
    type: String,
    default: '#000000'
  },
  fontFamily: {
    type: String,
    default: 'System'
  },
  fontSize: {
    type: Number,
    default: 14
  }
});

const notificationSettingsSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  types: {
    inventory: {
      enabled: { type: Boolean, default: true },
      threshold: { type: Number, default: 20 } // percentage
    },
    orders: {
      enabled: { type: Boolean, default: true },
      priority: { type: String, enum: ['all', 'high', 'medium'], default: 'all' }
    },
    deliveries: {
      enabled: { type: Boolean, default: true },
      status: [{ type: String, default: ['delayed', 'failed'] }]
    },
    maintenance: {
      enabled: { type: Boolean, default: true },
      types: [{ type: String, default: ['urgent', 'scheduled'] }]
    },
    quality: {
      enabled: { type: Boolean, default: true },
      issues: { type: String, enum: ['all', 'critical', 'major'], default: 'all' }
    }
  },
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true }
  }
});

const dashboardSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  layout: {
    type: String,
    enum: ['grid', 'list', 'compact'],
    default: 'grid'
  },
  widgets: [widgetSchema],
  theme: themeSchema,
  notifications: notificationSettingsSchema,
  defaultView: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  favorites: [{
    type: String,
    enum: ['inventory', 'orders', 'deliveries', 'workers', 'reports']
  }],
  customReports: [{
    name: String,
    description: String,
    query: mongoose.Schema.Types.Mixed,
    schedule: {
      enabled: Boolean,
      frequency: String,
      lastRun: Date,
      nextRun: Date
    }
  }],
  dataExport: {
    format: {
      type: String,
      enum: ['excel', 'pdf', 'csv'],
      default: 'excel'
    },
    autoExport: {
      enabled: Boolean,
      frequency: String,
      recipients: [String]
    }
  }
}, {
  timestamps: true
});

// Virtual for Arabic names
widgetSchema.virtual('titleAr').get(function() {
  const titles = {
    'stats': 'إحصائيات',
    'chart': 'رسم بياني',
    'list': 'قائمة',
    'map': 'خريطة',
    'calendar': 'تقويم',
    'custom': 'مخصص'
  };
  return titles[this.type] || this.title;
});

// Methods
dashboardSettingsSchema.methods.updateWidget = function(widgetId, updates) {
  const widget = this.widgets.id(widgetId);
  if (widget) {
    Object.assign(widget, updates);
  }
  return this.save();
};

dashboardSettingsSchema.methods.toggleWidget = function(widgetId) {
  const widget = this.widgets.id(widgetId);
  if (widget) {
    widget.enabled = !widget.enabled;
  }
  return this.save();
};

dashboardSettingsSchema.methods.reorderWidgets = function(newOrder) {
  const reorderedWidgets = newOrder.map(id => this.widgets.id(id));
  this.widgets = reorderedWidgets.filter(Boolean);
  return this.save();
};

// Statics
dashboardSettingsSchema.statics.getDefaultWidgets = function() {
  return [
    {
      id: 'quick-stats',
      type: 'stats',
      title: 'إحصائيات سريعة',
      position: { row: 0, column: 0, size: { width: 12, height: 1 } }
    },
    {
      id: 'sales-chart',
      type: 'chart',
      title: 'مخطط المبيعات',
      position: { row: 1, column: 0, size: { width: 8, height: 2 } }
    },
    {
      id: 'alerts-list',
      type: 'list',
      title: 'التنبيهات',
      position: { row: 1, column: 8, size: { width: 4, height: 2 } }
    },
    {
      id: 'inventory-status',
      type: 'chart',
      title: 'حالة المخزون',
      position: { row: 3, column: 0, size: { width: 6, height: 2 } }
    },
    {
      id: 'active-workers',
      type: 'list',
      title: 'العمال النشطون',
      position: { row: 3, column: 6, size: { width: 6, height: 2 } }
    }
  ];
};

const DashboardSettings = mongoose.model('DashboardSettings', dashboardSettingsSchema);

module.exports = DashboardSettings;
