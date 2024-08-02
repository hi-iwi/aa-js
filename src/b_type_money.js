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
     * @param {struct|NumberX} [vv]
     * @param {StringN} [vk]
     * @param {NumberX} [defaultV]
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
    /**
     * Calculate tax
     * @param {number|struct|Decimal} rates
     *      number => decimal(n)
     *      Decimal
     *      struct  阶梯税率  {money:decimal}
     *          e.g. {100*Money.Yuan:34*Percent.Percent, 200*Money.Yuan:34*Percent.Percent}
     * @param {number|Money} [base] 基准税金
     * @param {number|Money} [boundary] 基准税金对应基准税额
     * @return {Money}   // 子类继承，使用广泛的类型
     */
    tax(rates, base, boundary) {
        const newMoney = this.clone()
        if (!rates) {
            newMoney.value = 0
            return newMoney// 可以传递到
        }


        // @warn  rates 的百分比，必须是 * Percent.Percent 后的
        if (!atype.isStruct(rates)) {
            rates = decimal(rates)
            return newMoney.multiply(rates)
        }

        boundary = money(boundary)
        let tax = money()
        const keys = Object.keys(rates).sort()
        // iterate from greater to lesser
        for (let i = keys.length - 1; i > -1; i--) {
            const threshold = keys[i]// 阈值
            let min = threshold - boundary.valueOf() // 区间下限   money - money  会自动转为 .valueOf()
            if (newMoney.value <= min) {
                continue
            }
            const r = money(newMoney.value - min)
            newMoney.value = min
            const rate = decimal(rates[threshold])// 税率
            tax.plus(r.multiply(rate))
        }

        return base ? tax.plus(money(base)) : tax
    }


    /**
     *
     * @param {boolean} financial
     * @return {string}
     */
    toFinancialString(financial) {
        // 阿拉伯数字转中文，
        let c = fmt.toChineseNumber(this.toReal(), financial)
        if (c.indexOf("点") < 0) {
            return c + "元"
        }
        let g = c.split('点')
        let s = g[0] + '元'
        if (g.length > 1) {
            const dime = g[1][0]
            s += dime
            if (dime !== '零') {
                s += '角'
            }
            if (g[1].length > 1) {
                const cent = g[1][1]
                if (cent !== '零') {
                    s += cent + '分'
                }
            }
        }
        return s
    }
}


/**
 * New a {Money} instance
 * @param {struct|Money|NumberX} [vv]
 * @param {StringN} [vk]
 * @param {Money|NumberX} [defaultV]
 * @return {Money}
 */
function money(vv, vk, defaultV) {
    vv = defval(...arguments)
    if (vv instanceof Money) {
        return vv
    }
    return new Money(vv)
}
