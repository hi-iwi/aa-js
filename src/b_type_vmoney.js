// virtual money
class VMoney extends Money {
    name = 'aa-vmoney'
    // @override
    static Scale = 4
    // @override
    static Units = Math.pow(10, VMoney.Scale)
    // @override
    static Rounder = Math.round

    // @override
    type = 'vmoney'
    // @override
    group = 'money'

    // @override
    scale = Money.Scale
    // @override
    units = Money.Units
    // @override
    rounder = VMoney.Rounder   // 取整方式 ceil -> round up;  floor -> round down

    /**
     * @param {vv_vk_defaultV} [args]
     */
    constructor(...args) {
        super(...args)
    }
}

/**
 * New a {VMoney} instance
 * @param {vv_vk_defaultV} [args]
 */
function vmoney(...args) {
    const v = defval(...args)
    if (v instanceof VMoney) {
        return v
    }
    return new VMoney(v)
}