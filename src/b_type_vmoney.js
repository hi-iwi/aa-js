// virtual money
class vmoney extends money {
    name = 'aa-vmoney'
    // @override
    static Scale = 4
    // @override
    static Units = Math.pow(10, vmoney.Scale)
    // @override
    type = "vmoney"
    // @override
    rounder = Math.round
    // @override
    scale = money.Scale
    // @override
    units = money.Units
    /**
     *
     * @param {money|number|string} vv
     * @param {string} [vk]
     */
    constructor(vv, vk = void '') {
        super(vv, vk)
    }
}