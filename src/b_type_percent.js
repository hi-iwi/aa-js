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
     * @param {vv_vk_defaultV} [args]
     */
    constructor(...args) {
        super(...args)
    }
}

/**
 * New a {Percent} instance
 * @param {vv_vk_defaultV} [args]
 */
function percent(...args) {
    const v = defval(...args)
    if (v instanceof Percent) {
        return v
    }
    return new Percent(v)
}