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
     * @param {struct|NumberX} [vv]
     * @param {StringN} [vk]
     * @param {NumberX} [defaultV]
     */
    constructor(vv, vk, defaultV) {
        super(...arguments)
    }
}

/**
 * New a {VMoney} instance
 * @param {struct|NumberX|VMoney} vv
 * @param {StringN} [vk]
 * @param {NumberX|VMoney} [defaultV]
 */
function vmoney(vv, vk, defaultV) {
    vv = defval(...arguments)
    if (vv instanceof VMoney) {
        return vv
    }
    return new VMoney(vv)
}