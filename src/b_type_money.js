// @import money.Scale
class money extends decimal {
    static Scale = 4 // 货币 * 10000   Math.pow(10, money.Scale)
    static UnitMoney = Math.pow(10, money.Scale)
    static Min = Number.MIN_SAFE_INTEGER
    static Max = Number.MAX_SAFE_INTEGER

    static Cent = 100 // 分
    static Dime = 1000  // 角

    static Yuan = money.UnitMoney
    static WanYuan = 10000 * money.Yuan    // 万元
    static YiiYuan = 10000 * money.WanYuan // 亿元

    static Dollar = money.UnitMoney
    static KiloDollar = 1000 * money.Dollar   // 千元
    static MillionDollar = 1000 * money.KiloDollar // 百万元    中文的话，就不要用百万、千万
    static BillionDollar = 1000 * money.MillionDollar // 十亿元

    name = 'aa-money'
    type = "money"

    /**
     *
     * @param {money|number|string} vv
     * @param {string} [vk]
     */
    constructor(vv, vk = void '') {
        super(vv, vk)
         this.scale = money.Scale
        this.rounder = Math.round
    }

    toCent() {

    }
}