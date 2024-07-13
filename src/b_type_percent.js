class percent extends decimal {
    constructor(vv, vk) {
        super(vv, vk)
        this.type = "percent"
        this.scaleMax = C.PercentScale
        this.scale = C.PercentScale
        this.rounder = Math.round
    }
}