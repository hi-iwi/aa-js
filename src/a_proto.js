/**
 * 去除浮点数尾部的零
 * @param {number} fractionDigits 保留的小数位数
 * @returns {number} 处理后的数字
 * @example
 * (1.2000).toTrimmed(4) // 返回 1.2
 * (1.2340).toTrimmed(4) // 返回 1.234
 */
Number.prototype.toTrimmed = function (fractionDigits) {
    return Number(this.toFixed(fractionDigits).replace(/\.?0*$/, ''))
}

/**
 * 将数字格式化为指定精度，并添加千位分隔符
 * @param {number} [precision=0] 小数位数
 * @param {string} [separator=','] 千位分隔符
 * @returns {string} 格式化后的字符串
 * @example
 * (1234.5678).toFormat(2) // 返回 "1,234.57"
 */
Number.prototype.toFormat = function(precision = 0, separator = ',') {
    if (!Number.isFinite(this)) {
        return String(this);
    }
    
    const [int, dec] = this.toFixed(precision).split('.');
    const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return dec ? `${formattedInt}.${dec}` : formattedInt;
};