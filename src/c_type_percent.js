class percent extends decimal {
    name = 'aa-percent'

    /**
     *
     * @param {money|number|string} vv
     * @param {string} [vk]
     */
    constructor(vv, vk = void '') {
        super(vv, vk)
        this.type = "percent"
        this.scaleMax = C.PercentScale
        this.scale = C.PercentScale
        this.rounder = Math.round
    }

}