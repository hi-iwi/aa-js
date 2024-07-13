class money extends decimal {
    /**
     *
     * @param {money|number|string} vv
     * @param {string} [vk]
     */
    constructor(vv, vk = void '') {
        super(vv, vk)
        this.type = "money"
        this.scaleMax = C.MoneyScale
        this.scale = C.MoneyScale
        this.rounder = Math.round
    }

    toCent() {

    }
}