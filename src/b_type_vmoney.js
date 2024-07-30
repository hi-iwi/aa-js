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
     * @param {number|string} [vv]
     * @param {string} [vk]
     * @param {*} [defaultV]
     */
    constructor(vv, vk, defaultV) {
        super(...arguments)
    }
}

/**
 * New a {VMoney} instance
 * @param {number|string|struct|VMoney} vv
 * @param {string} [vk]
 * @param {*} [defaultV]
 */
function vmoney(vv, vk, defaultV) {
    vv = defval(...arguments)
    if (vv instanceof VMoney) {
        return vv
    }
    return new VMoney(vv)
}