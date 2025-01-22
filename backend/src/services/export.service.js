const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

class ExportService {
  static async createExcelWorkbook() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Water Delivery System';
    workbook.created = new Date();
    return workbook;
  }

  static setupWorksheetStyle(worksheet) {
    // Set RTL direction for Arabic text
    worksheet.views = [{ rightToLeft: true }];
    
    // Style for headers
    worksheet.getRow(1).font = {
      bold: true,
      size: 12,
      color: { argb: 'FF000000' }
    };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

  static async exportShortageReport(data, dateRange) {
    const workbook = await this.createExcelWorkbook();
    
    // Overview Sheet
    const overviewSheet = workbook.addWorksheet('نظرة عامة');
    this.setupWorksheetStyle(overviewSheet);
    
    overviewSheet.columns = [
      { header: 'البيان', key: 'label', width: 30 },
      { header: 'القيمة', key: 'value', width: 20 }
    ];

    overviewSheet.addRows([
      { label: 'إجمالي حالات النقص', value: data.statistics.totalShortages },
      { label: 'الحالات المحلولة', value: data.statistics.resolvedShortages },
      { label: 'الحالات المعلقة', value: data.statistics.pendingShortages },
      { label: 'إجمالي مبلغ النقص', value: data.statistics.totalAmount },
      { label: 'معدل الحل (%)', value: data.statistics.resolutionRate.toFixed(2) }
    ]);

    // Monthly Trend Sheet
    const trendSheet = workbook.addWorksheet('الاتجاه الشهري');
    this.setupWorksheetStyle(trendSheet);
    
    trendSheet.columns = [
      { header: 'الشهر', key: 'month', width: 15 },
      { header: 'عدد الحالات', key: 'count', width: 15 },
      { header: 'المبلغ', key: 'amount', width: 20 }
    ];

    data.monthlyTrend.forEach(trend => {
      trendSheet.addRow({
        month: `${trend._id.year}-${trend._id.month}`,
        count: trend.count,
        amount: trend.amount
      });
    });

    // Worker Stats Sheet
    const workerSheet = workbook.addWorksheet('إحصائيات العمال');
    this.setupWorksheetStyle(workerSheet);
    
    workerSheet.columns = [
      { header: 'اسم العامل', key: 'name', width: 25 },
      { header: 'عدد حالات النقص', key: 'shortages', width: 20 },
      { header: 'إجمالي المبلغ', key: 'amount', width: 20 },
      { header: 'الحالات المحلولة', key: 'resolved', width: 20 },
      { header: 'نسبة الحل', key: 'rate', width: 15 }
    ];

    data.workerStats.forEach(stat => {
      workerSheet.addRow({
        name: stat.worker.name,
        shortages: stat.totalShortages,
        amount: stat.totalAmount,
        resolved: stat.resolvedCount,
        rate: ((stat.resolvedCount / stat.totalShortages) * 100).toFixed(2)
      });
    });

    const fileName = `shortage-report-${moment().format('YYYY-MM-DD')}.xlsx`;
    const filePath = path.join(__dirname, '../exports', fileName);

    // Ensure exports directory exists
    if (!fs.existsSync(path.join(__dirname, '../exports'))) {
      fs.mkdirSync(path.join(__dirname, '../exports'), { recursive: true });
    }

    await workbook.xlsx.writeFile(filePath);
    return fileName;
  }

  static async exportWorkerPerformance(data, dateRange) {
    const workbook = await this.createExcelWorkbook();
    
    // Performance Overview Sheet
    const overviewSheet = workbook.addWorksheet('نظرة عامة الأداء');
    this.setupWorksheetStyle(overviewSheet);
    
    overviewSheet.columns = [
      { header: 'اسم العامل', key: 'name', width: 25 },
      { header: 'عدد الطلبات', key: 'orders', width: 15 },
      { header: 'الطلبات المكتملة', key: 'completed', width: 20 },
      { header: 'نسبة الإكمال', key: 'rate', width: 15 },
      { header: 'إجمالي التحصيل', key: 'collections', width: 20 },
      { header: 'عدد حالات النقص', key: 'shortages', width: 20 },
      { header: 'التقييم', key: 'rating', width: 15 }
    ];

    data.performance.forEach(perf => {
      overviewSheet.addRow({
        name: perf.worker.name,
        orders: perf.orders.total,
        completed: perf.orders.completed,
        rate: perf.orders.completionRate.toFixed(2),
        collections: perf.collections.total,
        shortages: perf.collections.shortages,
        rating: perf.rating.toFixed(2)
      });
    });

    const fileName = `worker-performance-${moment().format('YYYY-MM-DD')}.xlsx`;
    const filePath = path.join(__dirname, '../exports', fileName);

    await workbook.xlsx.writeFile(filePath);
    return fileName;
  }

  static async exportWorkerMetrics(data, workerId) {
    const workbook = await this.createExcelWorkbook();
    
    // Daily Metrics Sheet
    const dailySheet = workbook.addWorksheet('المؤشرات اليومية');
    this.setupWorksheetStyle(dailySheet);
    
    dailySheet.columns = [
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'عدد الطلبات', key: 'orders', width: 15 },
      { header: 'مبلغ التحصيل', key: 'amount', width: 20 },
      { header: 'الطلبات المكتملة', key: 'completed', width: 20 }
    ];

    data.metrics.daily.forEach(metric => {
      dailySheet.addRow({
        date: metric._id.date,
        orders: metric.ordersCount,
        amount: metric.collectionsAmount,
        completed: metric.completedOrders
      });
    });

    // Shortage History Sheet
    const shortageSheet = workbook.addWorksheet('سجل النقص');
    this.setupWorksheetStyle(shortageSheet);
    
    shortageSheet.columns = [
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'المبلغ', key: 'amount', width: 20 },
      { header: 'السبب', key: 'reason', width: 30 },
      { header: 'الحالة', key: 'status', width: 15 }
    ];

    data.metrics.shortages.forEach(shortage => {
      shortageSheet.addRow({
        date: moment(shortage.createdAt).format('YYYY-MM-DD'),
        amount: shortage.shortageAmount,
        reason: shortage.reason,
        status: shortage.status
      });
    });

    const fileName = `worker-metrics-${workerId}-${moment().format('YYYY-MM-DD')}.xlsx`;
    const filePath = path.join(__dirname, '../exports', fileName);

    await workbook.xlsx.writeFile(filePath);
    return fileName;
  }
}

module.exports = ExportService;
