const C = {
    HrefVoid: "javascript:;",
 

    // 9007199254740992 Number.MAX_SAFE_INTEGER
    Second: 1000,  // 1000ms
    Minute: 60000,
    Hour  : 3600000,
    Day   : 86400000,


    MaxDecimal: parseInt("".padEnd((Math.ceil(Number.MAX_SAFE_INTEGER / 10) + '').length, "9")),  // 最多支持999亿.9999
    MoneyScale: 4,  // 货币 * 10000   Math.pow(10, C.MoneyCarry)
    UnitMoney : 10000, //

    DecimalScale: 4, // 万分之一   Math.pow(10, C.DecimalCarry)
    PercentScale: 2,
    UnitDecimal : 10000,  // 10^4

    Percent   : 100.0, // 百分比，扩大100 * 100倍 --> 这里按百分比算，而不是小数  3* Percent 为 3% = 0.03
    Thousandth: 10.0,  // 千分比

    Wan: 10000, // 万
    Yi : 100000000, // 亿

    CoinScale: 4,
    UnitCoin : 10000,

    Cent: 100,    // 分
    Dime: 1000,  // 角


    Yuan   : 10000, // 元  = C.UnitMoney
    WanYuan: 100000000, // 万元
    YiiYuan: 1000000000000, // 亿元

    Dollar  : 10000, // 元 = C.UnitMoney
    KiDollar: 10000000, // 千元
    MiDollar: 10000000000, // 百万元   中文的话，就不要用百万、千万
    BiDollar: 10000000000000, // 十亿元

    MinMoney: Number.MIN_SAFE_INTEGER,
    MaxMoney: Number.MAX_SAFE_INTEGER,


}

