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

    constructor(vv, vk, defaultV) {
        super(...arguments)
    }
}