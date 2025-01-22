// Utility functions for validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^\+[0-9]{1,3}\s[0-9]{3}\s[0-9]{3}\s[0-9]{3}$/;
  return phoneRegex.test(phone);
};

const config = {
  // اعدادات اللغة
  language: {
    default: 'ar',
    direction: 'rtl',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm'
  },

  // اعدادات العملة
  currency: {
    code: 'SYP',
    name: 'ليرة سورية',
    symbol: 'ل.س',
    decimal_digits: 0,
    format: '{amount} {symbol}'
  },

  // رسائل النظام
  messages: {
    auth: {
      login_success: 'تم تسجيل الدخول بنجاح',
      login_failed: 'فشل تسجيل الدخول',
      register_success: 'تم إنشاء الحساب بنجاح',
      register_failed: 'فشل إنشاء الحساب',
      logout_success: 'تم تسجيل الخروج بنجاح'
    },
    orders: {
      created: 'تم إنشاء الطلب بنجاح',
      updated: 'تم تحديث الطلب بنجاح',
      deleted: 'تم حذف الطلب بنجاح',
      not_found: 'الطلب غير موجود',
      assigned: 'تم تعيين الطلب للعامل',
      completed: 'تم إكمال الطلب بنجاح'
    },
    payments: {
      success: 'تم تسجيل الدفعة بنجاح',
      failed: 'فشل تسجيل الدفعة',
      shortage: 'يوجد نقص في المبلغ المدفوع'
    },
    workers: {
      assigned: 'تم تعيين المهمة بنجاح',
      busy: 'العامل مشغول حالياً',
      not_available: 'العامل غير متوفر'
    },
    validation: {
      required: 'هذا الحقل مطلوب',
      invalid_format: 'صيغة غير صحيحة',
      min_length: 'الحد الأدنى للأحرف: {min}',
      max_length: 'الحد الأقصى للأحرف: {max}',
      invalid_phone: 'رقم الهاتف غير صحيح',
      invalid_email: 'البريد الإلكتروني غير صحيح'
    }
  },

  // اعدادات التطبيق
  app: {
    name: 'نظام توصيل المياه',
    version: '1.0.0',
    company: 'شركة المياه',
    support_email: 'support@water.com',
    support_phone: '+963 000 000 000',
    validate() {
      if (!validateEmail(this.support_email)) {
        throw new Error('Invalid support email format');
      }
      if (!validatePhone(this.support_phone)) {
        throw new Error('Invalid support phone format');
      }
      return true;
    }
  },

  // اعدادات الطلبات
  orders: {
    statuses: {
      pending: 'قيد الانتظار',
      assigned: 'تم التعيين',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتمل',
      cancelled: 'ملغي'
    },
    payment_statuses: {
      pending: 'قيد الانتظار',
      paid: 'مدفوع',
      partially_paid: 'مدفوع جزئياً',
      shortage: 'نقص',
      cancelled: 'ملغي'
    }
  },

  // اعدادات التقارير
  reports: {
    types: {
      daily: 'تقرير يومي',
      weekly: 'تقرير أسبوعي',
      monthly: 'تقرير شهري',
      custom: 'تقرير مخصص'
    },
    formats: {
      pdf: 'PDF',
      excel: 'Excel'
    }
  }
};

// Validate configuration on export
config.app.validate();

module.exports = config;
