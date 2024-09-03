/**
 * Trim tailing zeros from a fixed float number
 * @param {number} fractionDigits
 */
Number.prototype.toTrimmed = function (fractionDigits) {
    return Number(this.toFixed(fractionDigits).replace(/\.?0*$/, ''))
}