class money extends decimal {
    name = 'aa-money'
    type = "money"

    /**
     *
     * @param {money|number|string} vv
     * @param {string} [vk]
     */
    constructor(vv, vk = void '') {
        super(vv, vk)
        this.scaleMax = C.MoneyScale
        this.scale = C.MoneyScale
        this.rounder = Math.round
    }

    toCent() {

    }
}