import axios from 'axios';
import { API_URL } from '../config';

class DashboardService {
  static async getDashboardData(period = 'today') {
    try {
      const response = await axios.get(`${API_URL}/dashboard`, {
        params: { period }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getPerformanceMetrics(options = {}) {
    try {
      const response = await axios.get(`${API_URL}/dashboard/performance`, {
        params: options
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getInventoryStatus() {
    try {
      const response = await axios.get(`${API_URL}/dashboard/inventory`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getActiveWorkers() {
    try {
      const response = await axios.get(`${API_URL}/dashboard/workers/active`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getAlerts(options = {}) {
    try {
      const response = await axios.get(`${API_URL}/dashboard/alerts`, {
        params: options
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async markAlertAsRead(alertId) {
    try {
      const response = await axios.patch(`${API_URL}/dashboard/alerts/${alertId}/read`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getRevenueStats(period = 'month') {
    try {
      const response = await axios.get(`${API_URL}/dashboard/revenue`, {
        params: { period }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getCustomerStats() {
    try {
      const response = await axios.get(`${API_URL}/dashboard/customers`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getDeliveryStats(period = 'today') {
    try {
      const response = await axios.get(`${API_URL}/dashboard/deliveries`, {
        params: { period }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getQualityMetrics() {
    try {
      const response = await axios.get(`${API_URL}/dashboard/quality`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getMaintenanceStatus() {
    try {
      const response = await axios.get(`${API_URL}/dashboard/maintenance`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static handleError(error) {
    if (error.response) {
      // خطأ من الخادم
      const message = error.response.data?.message || 'حدث خطأ في الخادم';
      throw new Error(message);
    } else if (error.request) {
      // لم يتم استلام رد
      throw new Error('لا يمكن الاتصال بالخادم');
    } else {
      // خطأ في إعداد الطلب
      throw new Error('حدث خطأ في الطلب');
    }
  }
}

export default DashboardService;
