class Money extends Decimal {
    // @override
    name = 'aa-money'

    // @override
    static Scale = 4 // 货币 * 10000   Math.pow(10, Money.Scale)
    // @override
    static Units = Math.pow(10, Money.Scale)
    static Min = Number.MIN_SAFE_INTEGER
    static Max = Number.MAX_SAFE_INTEGER

    static Cent = 100 // 分
    static Dime = 1000  // 角

    static Yuan = Money.Units
    static WanYuan = 10000 * Money.Yuan    // 万元
    static YiiYuan = 10000 * Money.WanYuan // 亿元

    static Dollar = Money.Units
    static KiloDollar = 1000 * Money.Dollar   // 千元
    static MillionDollar = 1000 * Money.KiloDollar // 百万元    中文的话，就不要用百万、千万
    static BillionDollar = 1000 * Money.MillionDollar // 十亿元

    // @override
    scale = Money.Scale
    // @override
    units = Money.Units

    // @override
    type = "money"
    // @override
    rounder = Math.round

    /**
     * @param {number|string} [vv]
     * @param {string} [vk]
     * @param {*} [defaultV]
     */
    constructor(vv, vk, defaultV) {
        super(...arguments)
    }

    toCent() {

    }
}


/**
 * New a {Money} instance
 * @param {number|string|struct|Money} vv
 * @param {string} [vk]
 * @param {*} [defaultV]
 */
function money(vv, vk, defaultV) {
    vv = defval(...arguments)
    if (vv instanceof Money) {
        return vv
    }
    return new Money(vv)
}
