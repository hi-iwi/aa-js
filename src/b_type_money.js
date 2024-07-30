class Money extends Decimal {
    // @override
    name = 'aa-money'

    // @override
    static Scale = 4 // 货币 * 10000   Math.pow(10, Money.Scale)
    // @override
    static Units = Math.pow(10, Money.Scale)
    // @override
    static Rounder = Math.round

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
    rounder = Money.Rounder   // 取整方式 ceil -> round up;  floor -> round down
    // @override
    type = 'money'
    // @override
    group = 'money'


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
    /*
     *  @param decimal|{money:decimal} rates 税率，若是struct，则表示阶梯税率
     *  {
     *       100 * Money.Yuan: 0.5 * Percent.Percent    (100-boundary,200-boundary]元部分，缴纳0.5%
     *       200 * Money.Yuan: 1 * Percent.Percent      (200-boundary,] 以上部分
     *  }
     *  @param int base 如果有某个基数，如税费低于1万元，固定收500元，那么后面再增加 500 即可
    *  @param money number  boundary   阶梯税率是否包括临界值
    *       0 表示不包含临界值，如 100 * Money.Yuan； 如 boundary = Money.Yuan 则表示
    * @return AaMath.Money
     */
    tax(rates, base = 0, boundary = 0) {
        const newMoney = this.clone()
        // @warn  rates 的百分比，必须是 * Percent.Percent 后的
        if (typeof rates === "number") {
            return  newMoney.multiply(rates)
        }
        if( rates instanceof Decimal){
            return newMoney.multiply()
        }
        if (len(rates) === 0) {
            return m
        }
        /*
        rates:  {100:34*Percent.Percent, 200:34*Percent.Percent}
         */
        base = intMax(base)
        let w = m.Value
        let tax = 0
// 由大到小排列
        const keys = Object.keys(rates).sort((a, b) => b - a)
        const n = keys.length
        for (let i = 0; i < n; i++) {
            let rate = rates[keys[i]] // 税率
            let min = keys[i] - boundary // 区间下限
            if (w <= min) {
                continue
            }
            let r = w - min
            tax += AaMathOld.Money(r).MulRoundD(rate).Value
        }
        return AaMathOld.Money(tax + base)
    }
}


/**
 * New a {Money} instance
 * @param {number|string|struct|Money} [vv]
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
