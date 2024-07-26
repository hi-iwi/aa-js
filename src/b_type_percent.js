// @import percent.Scale
class percent extends decimal {
    name = 'aa-percent'

    // @override
    static Scale = 2  // Math.pow(10, percent.Scale)
    // @override
    static Units = Math.pow(10, percent.Scale)
    static Percent = 100.0 // 百分比，扩大100 * 100倍 --> 这里按百分比算，而不是小数  3* Percent 为 3% = 0.03
    static Thousandth = 10.0  // 千分比

    // @override
    type = "percent"
    // @override
    rounder = Math.round
    // @override
    scale = percent.Scale
    // @override
    units = percent.Units


    toPercent(sign = '') {
        return this.toReal() * percent.Percent + string(sign)
    }

    /**
     *
     * @param {money|number|string} vv
     * @param {string} [vk]
     */
    constructor(vv, vk = void '') {
        super(vv, vk)
    }


}