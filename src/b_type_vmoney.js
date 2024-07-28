// virtual money
class VMoney extends Money {
    name = 'aa-vmoney'
    // @override
    static Scale = 4
    // @override
    static Units = Math.pow(10, VMoney.Scale)
    // @override
    type = "vmoney"
    // @override
    rounder = Math.round
    // @override
    scale = Money.Scale
    // @override
    units = Money.Units

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
 * @param {number|string} vv
 * @param {string} [vk]
 * @param {*} [defaultV]
 */
function vmoney(vv, vk, defaultV) {
    return new VMoney(...arguments)
}