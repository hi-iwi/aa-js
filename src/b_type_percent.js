class Percent extends Decimal {
    name = 'aa-percent'

    // @override
    static Scale = 2  // Math.pow(10, Percent.Scale)
    // @override
    static Units = Math.pow(10, Percent.Scale)
    static Percent = 100.0 // 百分比，扩大100 * 100倍 --> 这里按百分比算，而不是小数  3* Percent 为 3% = 0.03
    static Thousandth = 10.0  // 千分比

    // @override
    type = "percent"
    // @override
    rounder = Math.round
    // @override
    scale = Percent.Scale
    // @override
    units = Percent.Units


    toPercent(sign = '') {
        return this.toReal() * Percent.Percent + string(sign)
    }

    /**
     * @param {number|string} [vv]
     * @param {string} [vk]
     * @param {*} [defaultV]
     */
    constructor(vv, vk, defaultV) {
        super(...arguments)
    }
}

/**
 * New a {Percent} instance
 * @param {number|string|struct|Percent} vv
 * @param {string} [vk]
 * @param {*} [defaultV]
 */
function percent(vv, vk, defaultV) {
    vv = defval(...arguments)
    if (vv instanceof Percent) {
        return vv
    }
    return new Percent(vv)
}