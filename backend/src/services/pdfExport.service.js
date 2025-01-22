const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class PDFExportService {
  static async createPDF(data, template, options = {}) {
    const doc = new PDFDocument({
      size: 'A4',
      rtl: true // Enable RTL for Arabic text
    });

    const fileName = `${template}-${moment().format('YYYY-MM-DD')}.pdf`;
    const filePath = path.join(__dirname, '../exports', fileName);

    // Ensure exports directory exists
    if (!fs.existsSync(path.join(__dirname, '../exports'))) {
      fs.mkdirSync(path.join(__dirname, '../exports'), { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add company logo and header
    await this.addHeader(doc, options.title);

    // Apply template
    switch (template) {
      case 'shortage':
        await this.generateShortageReport(doc, data);
        break;
      case 'performance':
        await this.generatePerformanceReport(doc, data);
        break;
      case 'metrics':
        await this.generateMetricsReport(doc, data);
        break;
      case 'daily':
        await this.generateDailyReport(doc, data);
        break;
    }

    // Add footer with page numbers
    this.addFooter(doc);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(fileName));
      stream.on('error', reject);
    });
  }

  static async addHeader(doc, title) {
    doc.fontSize(20)
      .text(title || 'تقرير', { align: 'center' })
      .moveDown();

    doc.fontSize(12)
      .text(`تاريخ التقرير: ${moment().format('YYYY-MM-DD')}`, { align: 'right' })
      .moveDown(2);
  }

  static addFooter(doc) {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
        .text(
          `الصفحة ${i + 1} من ${pages.count}`,
          doc.page.margins.left,
          doc.page.height - 50,
          { align: 'center' }
        );
    }
  }

  static async generateShortageReport(doc, data) {
    // Overview section
    doc.fontSize(16)
      .text('نظرة عامة', { align: 'right' })
      .moveDown();

    const stats = data.statistics;
    doc.fontSize(12)
      .text(`إجمالي حالات النقص: ${stats.totalShortages}`, { align: 'right' })
      .text(`الحالات المحلولة: ${stats.resolvedShortages}`, { align: 'right' })
      .text(`الحالات المعلقة: ${stats.pendingShortages}`, { align: 'right' })
      .text(`إجمالي مبلغ النقص: ${stats.totalAmount}`, { align: 'right' })
      .text(`معدل الحل: ${stats.resolutionRate.toFixed(2)}%`, { align: 'right' })
      .moveDown(2);

    // Worker statistics
    doc.fontSize(16)
      .text('إحصائيات العمال', { align: 'right' })
      .moveDown();

    data.workerStats.forEach(stat => {
      doc.fontSize(12)
        .text(`${stat.worker.name}:`, { align: 'right' })
        .text(`  - عدد حالات النقص: ${stat.totalShortages}`, { align: 'right' })
        .text(`  - إجمالي المبلغ: ${stat.totalAmount}`, { align: 'right' })
        .text(`  - الحالات المحلولة: ${stat.resolvedCount}`, { align: 'right' })
        .moveDown();
    });

    // Monthly trend
    doc.addPage();
    doc.fontSize(16)
      .text('الاتجاه الشهري', { align: 'right' })
      .moveDown();

    data.monthlyTrend.forEach(trend => {
      doc.fontSize(12)
        .text(`${trend._id.year}-${trend._id.month}:`, { align: 'right' })
        .text(`  - عدد الحالات: ${trend.count}`, { align: 'right' })
        .text(`  - المبلغ: ${trend.amount}`, { align: 'right' })
        .moveDown();
    });
  }

  static async generatePerformanceReport(doc, data) {
    doc.fontSize(16)
      .text('تقرير أداء العمال', { align: 'right' })
      .moveDown();

    data.performance.forEach(perf => {
      doc.fontSize(14)
        .text(perf.worker.name, { align: 'right' })
        .moveDown();

      doc.fontSize(12)
        .text('الطلبات:', { align: 'right' })
        .text(`  - إجمالي الطلبات: ${perf.orders.total}`, { align: 'right' })
        .text(`  - الطلبات المكتملة: ${perf.orders.completed}`, { align: 'right' })
        .text(`  - نسبة الإكمال: ${perf.orders.completionRate.toFixed(2)}%`, { align: 'right' })
        .moveDown();

      doc.text('التحصيل:', { align: 'right' })
        .text(`  - إجمالي التحصيل: ${perf.collections.total}`, { align: 'right' })
        .text(`  - عدد حالات النقص: ${perf.collections.shortages}`, { align: 'right' })
        .text(`  - نسبة النقص: ${perf.collections.shortageRate.toFixed(2)}%`, { align: 'right' })
        .moveDown();

      doc.text(`التقييم: ${perf.rating.toFixed(2)}`, { align: 'right' })
        .moveDown(2);
    });
  }

  static async generateMetricsReport(doc, data) {
    const metrics = data.metrics;

    // Summary section
    doc.fontSize(16)
      .text('ملخص الأداء', { align: 'right' })
      .moveDown();

    const summary = metrics.summary;
    doc.fontSize(12)
      .text(`إجمالي الطلبات: ${summary.totalOrders}`, { align: 'right' })
      .text(`الطلبات المكتملة: ${summary.completedOrders}`, { align: 'right' })
      .text(`إجمالي التحصيل: ${summary.totalCollections}`, { align: 'right' })
      .text(`متوسط التقييم: ${summary.avgRating.toFixed(2)}`, { align: 'right' })
      .moveDown(2);

    // Daily metrics
    doc.addPage();
    doc.fontSize(16)
      .text('المؤشرات اليومية', { align: 'right' })
      .moveDown();

    metrics.daily.forEach(day => {
      doc.fontSize(12)
        .text(`${day._id.date}:`, { align: 'right' })
        .text(`  - عدد الطلبات: ${day.ordersCount}`, { align: 'right' })
        .text(`  - مبلغ التحصيل: ${day.collectionsAmount}`, { align: 'right' })
        .text(`  - الطلبات المكتملة: ${day.completedOrders}`, { align: 'right' })
        .moveDown();
    });

    // Shortage history
    doc.addPage();
    doc.fontSize(16)
      .text('سجل النقص', { align: 'right' })
      .moveDown();

    metrics.shortages.forEach(shortage => {
      doc.fontSize(12)
        .text(`${moment(shortage.createdAt).format('YYYY-MM-DD')}:`, { align: 'right' })
        .text(`  - المبلغ: ${shortage.shortageAmount}`, { align: 'right' })
        .text(`  - السبب: ${shortage.reason}`, { align: 'right' })
        .text(`  - الحالة: ${shortage.status}`, { align: 'right' })
        .moveDown();
    });
  }

  static async generateDailyReport(doc, data) {
    doc.fontSize(16)
      .text('التقرير اليومي', { align: 'right' })
      .moveDown();

    // Daily summary
    doc.fontSize(14)
      .text('ملخص اليوم', { align: 'right' })
      .moveDown();

    doc.fontSize(12)
      .text(`إجمالي التحصيل: ${data.totalCollections}`, { align: 'right' })
      .text(`عدد الطلبات: ${data.totalOrders}`, { align: 'right' })
      .text(`حالات النقص: ${data.shortagesCount}`, { align: 'right' })
      .moveDown(2);

    // Worker performance
    doc.fontSize(14)
      .text('أداء العمال', { align: 'right' })
      .moveDown();

    data.workers.forEach(worker => {
      doc.fontSize(12)
        .text(worker.name, { align: 'right' })
        .text(`  - الطلبات المنجزة: ${worker.completedOrders}`, { align: 'right' })
        .text(`  - مبلغ التحصيل: ${worker.collections}`, { align: 'right' })
        .text(`  - حالات النقص: ${worker.shortages}`, { align: 'right' })
        .moveDown();
    });

    // Issues and notes
    if (data.issues && data.issues.length > 0) {
      doc.addPage();
      doc.fontSize(14)
        .text('الملاحظات والمشاكل', { align: 'right' })
        .moveDown();

      data.issues.forEach(issue => {
        doc.fontSize(12)
          .text(`- ${issue}`, { align: 'right' })
          .moveDown();
      });
    }
  }
}

module.exports = PDFExportService;
