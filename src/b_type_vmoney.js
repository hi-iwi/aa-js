// virtual money
class vmoney extends money {
    static Scale = 4
    static Unit = Math.pow(10, vmoney.Scale)
    name = 'aa-vmoney'
    type = "vmoney"

    /**
     *
     * @param {money|number|string} vv
     * @param {string} [vk]
     */
    constructor(vv, vk = void '') {
        super(vv, vk)
         this.scale =vmoney.Scale
        this.rounder = Math.round
    }
}