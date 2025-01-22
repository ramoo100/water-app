const appConfig = require('../config/app.config');

class CurrencyUtil {
  static format(amount) {
    const { format, symbol } = appConfig.currency;
    const formattedAmount = Math.round(amount); // No decimal places for SYP
    return format
      .replace('{amount}', formattedAmount.toLocaleString('ar-SY'))
      .replace('{symbol}', symbol);
  }

  static parse(formattedAmount) {
    const { symbol } = appConfig.currency;
    return parseInt(formattedAmount.replace(symbol, '').replace(/,/g, ''), 10);
  }

  static roundToNearest(amount) {
    // Round to nearest 50 SYP
    return Math.round(amount / 50) * 50;
  }

  static formatRange(min, max) {
    return `${this.format(min)} - ${this.format(max)}`;
  }

  static formatShorthand(amount) {
    if (amount >= 1000000) {
      return this.format(Math.round(amount / 1000000)) + ' مليون';
    } else if (amount >= 1000) {
      return this.format(Math.round(amount / 1000)) + ' ألف';
    }
    return this.format(amount);
  }
}

module.exports = CurrencyUtil;
