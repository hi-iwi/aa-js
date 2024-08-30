/**
 * Normal Mathematics
 */
class math {
    name = 'aa-mathn'

    static Wan = 10000 // 万
    static Yii = 100000000 // 亿

    static Million = 1000000 // 100万
    static Billion = 1000000000 // 10亿

    static KB = 1024
    static MB = 1024 * 1024
    static GB = 1024 * 1024 * 1024

    static ComparisonSymbols = ['>', '<', '=', '==', '>=', '<=']


    /**
     * Get the value of the closest key in a setting
     * @param {(number|string)[]} values
     * @param {ComparisonSymbol} symbol
     *      >           the closest and greater value
     *      <           the closest and lesser value
     *      = or ==     the closest value, may be lesser, equal to or greater
     *      >=          the closest and greater value or equal value
     *      <=          the closest and lesser value or equal value
     * @param {number|string} value
     * @return {number}
     */
    static closest(values, symbol, value) {

        values.sort() // Ascending order 字符串和数字都一样能排序
        value = Number(value)
        const s1 = symbol[0]
        const s2 = symbol.slice(1)
        const equal = s1 === '=' || s2 === '='
        for (let i = 0; i < values.length; i++) {
            const originV = values[i]   // 返回原始值，方便外面是Object.keys()传进来的
            const v = parseFloat(originV)
            if (equal && v === value) {
                return v
            }
            if (v > value) {
                const prev = i === 0 ? originV : values[i - 1]
                if (s1 === '>') {
                    // the closest and greater value
                    return originV
                } else if (s1 === '<') {
                    // the closest and lesser value
                    return prev
                } else if (s1 === '=') {
                    // the closest  value
                    return value - prev <= v - value ? prev : originV
                }
            }
        }
    }

}
