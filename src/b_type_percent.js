class Percent extends Decimal {
    name = 'aa-percent'

    // @override
    static Scale = 2  // Math.pow(10, Percent.Scale)
    // @override
    static Units = Math.pow(10, Percent.Scale)
    // @override
    static Rounder = Math.round

    static Percent = 100.0 // 百分比，扩大100 * 100倍 --> 这里按百分比算，而不是小数  3* Percent 为 3% = 0.03
    static Thousandth = 10.0  // 千分比

    // @override
    type = 'percent'
    // @override
    group = 'decimal'

    // @override
    scale = Percent.Scale
    // @override
    units = Percent.Units
    // @override
    rounder = Percent.Rounder   // 取整方式 ceil -> round up;  floor -> round down

    toPercent(sign = '') {
        return this.toReal() * Percent.Percent + string(sign)
    }

    /**
     * @param {struct|NumberX} [vv]
     * @param {StringN} [vk]
     * @param {NumberX} [defaultV]
     */
    constructor(vv, vk, defaultV) {
        super(...arguments)
    }
}

/**
 * New a {Percent} instance
 * @param {struct|Percent|NumberX} vv
 * @param {StringN} [vk]
 * @param {Percent|NumberX} [defaultV]
 */
function percent(vv, vk, defaultV) {
    vv = defval(...arguments)
    if (vv instanceof Percent) {
        return vv
    }
    return new Percent(vv)
}