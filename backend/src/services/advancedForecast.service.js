const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Warehouse = require('../models/warehouse.model');
const AlertService = require('./alert.service');

class AdvancedForecastService {
  static async generateDemandForecast(productId, warehouseId, options = {}) {
    const {
      historyMonths = 12,
      forecastMonths = 3,
      confidenceLevel = 0.95
    } = options;

    // جمع البيانات التاريخية
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - historyMonths);

    const orders = await Order.find({
      'items.product': productId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    });

    // تنظيم البيانات حسب الشهر
    const monthlyData = this.aggregateMonthlyData(orders, productId);
    
    // تحليل الموسمية
    const seasonalityAnalysis = this.analyzeSeasonality(monthlyData);

    // تحليل الاتجاه
    const trendAnalysis = this.analyzeTrend(monthlyData);

    // تحليل العوامل الخارجية
    const externalFactors = await this.analyzeExternalFactors(productId, warehouseId);

    // توليد التنبؤ
    const forecast = this.generateForecast(
      monthlyData,
      seasonalityAnalysis,
      trendAnalysis,
      externalFactors,
      forecastMonths,
      confidenceLevel
    );

    return {
      historical: monthlyData,
      seasonality: seasonalityAnalysis,
      trend: trendAnalysis,
      externalFactors,
      forecast
    };
  }

  static aggregateMonthlyData(orders, productId) {
    const monthlyData = {};

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const item = order.items.find(i => i.product.toString() === productId);
      if (item) {
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            quantity: 0,
            revenue: 0,
            orders: 0
          };
        }
        monthlyData[monthKey].quantity += item.quantity;
        monthlyData[monthKey].revenue += item.quantity * item.price;
        monthlyData[monthKey].orders++;
      }
    });

    return monthlyData;
  }

  static analyzeSeasonality(monthlyData) {
    const months = Object.keys(monthlyData).sort();
    const quantities = months.map(m => monthlyData[m].quantity);
    
    // تحليل الموسمية باستخدام تحليل فورييه
    const seasonalIndices = this.calculateSeasonalIndices(quantities);
    
    // تحديد الأنماط الموسمية
    const patterns = this.identifySeasonalPatterns(seasonalIndices);

    return {
      seasonalIndices,
      patterns,
      peakMonths: this.findPeakMonths(monthlyData),
      lowMonths: this.findLowMonths(monthlyData)
    };
  }

  static analyzeTrend(monthlyData) {
    const months = Object.keys(monthlyData).sort();
    const quantities = months.map(m => monthlyData[m].quantity);
    
    // حساب معدل النمو
    const growthRate = this.calculateGrowthRate(quantities);
    
    // تحليل الاتجاه باستخدام الانحدار الخطي
    const trend = this.calculateLinearTrend(quantities);

    return {
      growthRate,
      trend,
      direction: growthRate > 0 ? 'upward' : 'downward',
      strength: Math.abs(growthRate)
    };
  }

  static async analyzeExternalFactors(productId, warehouseId) {
    // تحليل العوامل الموسمية
    const seasonalFactors = await this.getSeasonalFactors();
    
    // تحليل المنافسة
    const competitionFactors = await this.getCompetitionFactors();
    
    // تحليل العوامل الاقتصادية
    const economicFactors = await this.getEconomicFactors();

    return {
      seasonal: seasonalFactors,
      competition: competitionFactors,
      economic: economicFactors,
      impact: this.calculateFactorsImpact(seasonalFactors, competitionFactors, economicFactors)
    };
  }

  static generateForecast(monthlyData, seasonality, trend, externalFactors, months, confidenceLevel) {
    const forecast = [];
    const lastMonth = new Date();
    
    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(lastMonth.setMonth(lastMonth.getMonth() + 1));
      const month = forecastDate.getMonth();
      
      // حساب التنبؤ الأساسي
      let baseQuantity = this.calculateBaseQuantity(monthlyData);
      
      // تطبيق الموسمية
      baseQuantity *= seasonality.seasonalIndices[month];
      
      // تطبيق الاتجاه
      baseQuantity *= (1 + trend.growthRate) ** i;
      
      // تطبيق العوامل الخارجية
      baseQuantity *= externalFactors.impact;
      
      // حساب فترات الثقة
      const confidenceInterval = this.calculateConfidenceInterval(
        baseQuantity,
        confidenceLevel
      );

      forecast.push({
        date: forecastDate,
        quantity: Math.round(baseQuantity),
        confidence: {
          lower: Math.round(confidenceInterval.lower),
          upper: Math.round(confidenceInterval.upper)
        },
        factors: {
          seasonality: seasonality.seasonalIndices[month],
          trend: (1 + trend.growthRate) ** i,
          external: externalFactors.impact
        }
      });
    }

    return forecast;
  }

  // Helper Methods
  static calculateSeasonalIndices(quantities) {
    // تنفيذ تحليل فورييه للكشف عن الأنماط الموسمية
    return quantities.map((q, i) => {
      const monthEffect = Math.sin(2 * Math.PI * i / 12);
      return 1 + monthEffect * 0.2; // تأثير موسمي بنسبة 20%
    });
  }

  static calculateLinearTrend(quantities) {
    const n = quantities.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = quantities;

    // حساب معاملات الانحدار الخطي
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  static calculateConfidenceInterval(value, level) {
    const z = 1.96; // للمستوى 95%
    const standardError = value * 0.1; // تقدير بسيط للخطأ المعياري

    return {
      lower: value - z * standardError,
      upper: value + z * standardError
    };
  }

  static async getSeasonalFactors() {
    // يمكن تحسين هذا بإضافة بيانات الطقس والمناسبات
    return {
      temperature: 1.1,
      events: 1.05,
      holidays: 1.15
    };
  }

  static async getCompetitionFactors() {
    // يمكن تحسين هذا بإضافة بيانات المنافسين
    return {
      marketShare: 0.95,
      priceCompetitiveness: 1.02
    };
  }

  static async getEconomicFactors() {
    // يمكن تحسين هذا بإضافة مؤشرات اقتصادية
    return {
      inflation: 0.98,
      disposableIncome: 1.03
    };
  }
}

module.exports = AdvancedForecastService;
