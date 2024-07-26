// @import money.Scale
class money extends decimal {
    // @override
    name = 'aa-money'

    // @override
    static Scale = 4 // 货币 * 10000   Math.pow(10, money.Scale)
    // @override
    static Units = Math.pow(10, money.Scale)
    static Min = Number.MIN_SAFE_INTEGER
    static Max = Number.MAX_SAFE_INTEGER

    static Cent = 100 // 分
    static Dime = 1000  // 角

    static Yuan = money.Units
    static WanYuan = 10000 * money.Yuan    // 万元
    static YiiYuan = 10000 * money.WanYuan // 亿元

    static Dollar = money.Units
    static KiloDollar = 1000 * money.Dollar   // 千元
    static MillionDollar = 1000 * money.KiloDollar // 百万元    中文的话，就不要用百万、千万
    static BillionDollar = 1000 * money.MillionDollar // 十亿元

    // @override
    scale = money.Scale
    // @override
    units = money.Units

    // @override
    type = "money"
    // @override
    rounder = Math.round

    /**
     *
     * @param {money|number|string} vv
     * @param {string} [vk]
     */
    constructor(vv, vk = void '') {
        super(vv, vk)
    }

    toCent() {

    }
}