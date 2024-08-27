// 基础static class
class fmt {
    name = 'aa-fmt'

    /**
     * Exclude undefined arguments at the tail
     * @param {any} args
     * @note some functions like new Date().setFullYear(2025, void 0)  will return invalid date!
     * @return {any[]}
     */
    static args(...args) {
        for (let i = args.length - 1; i > -1; i--) {
            if (typeof args[i] !== 'undefined') {
                return [...args.slice(0, i + 1)]
            }
        }
        return []
    }

    /**
     * Capitalize the first letter of each word and leave the other letters lowercase
     * @param {string} s  separate words with spaces, underscore(_) or hyphen(-)
     * @param {boolean} handleCases
     */
    static capitalizeEachWord(s, handleCases = false) {
        if (handleCases) {
            s = fmt.toSnakeCase(s).replaceAll('_', ' ')
        }
        s = s.replace(/(^|[\s_-])([a-z])/g, function (x, y, z) {
            return y + z.toUpperCase()
        })
        return s
    }

    /**
     * Format string with specified formats
     * @param {string} format
     *  %s string
     * @param args
     * @return {string}
     */
    static sprintf(format, ...args) {
        let matches = [...format.matchAll(/%s/g)]
        if (matches.length !== args.length) {
            log.error(`fmt.sprintf("${format}", ${args})  invalid number of arguments, expected ${matches.length}, but get ${args.length}.`)
        }

        for (let i = 0; i < matches.length; i++) {
            if (args.length - 1 < i) {
                break
            }
            format = format.replace(matches[i][0], args[i])
        }
        return format
    }

    /**
     * Translate formatted string
     * @param {?struct} dict
     * @param args
     * @return {string}
     * @example fmt.translate({'I LOVE %s':'我爱%s'}, "I LOVE %s", "你")    ===>   我爱你
     */
    static translate(dict, ...args) {
        if (len(dict) === 0 || args.length < 1) {
            return ""
        }
        let format = dict && dict[args[0]] ? dict[args[0]] : args[0]
        return fmt.sprintf(format, ...args.slice(1))
    }

    /**
     * Convert  UPPER_UNDERSCORE_CASE/snake_case/PascalCase/kebab-case to  camelCase
     * @param {string } s
     * @return {string}
     */
    static toCamelCase(s) {
        return s.toLowerCase().replace(/[^a-z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
    }


    // 将阿拉伯数字，转为小写中文

    /**
     * Convert Arabic numerals to Chinese numerals
     * @param {number|string} num
     * @param {boolean} financial convert to financial numerals (`capital` numerals)
     * @return {string}
     */
    static toChineseNumber(num, financial = false) {
        num = float64(num)
        let hanziNum = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']

        let units = ['个', '万', '亿', '万亿', '兆']
        let suffix = ['', '十', '百', '千']
        if (financial) {
            hanziNum = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
            // 万之后，不用大写
            units = ['个', '万', '亿', '万亿', '兆']
            suffix = ['', '拾', '佰', '仟']
        }
        let s = string(num)
        if (s.indexOf(".") > -1) {
            const a = s.split(".")
            let d = a[1]
            let ds = ''
            for (let i = 0; i < d.length; i++) {
                ds += hanziNum[d[i]]
            }
            return fmt.toChineseNumber(a[0]) + "点" + ds
        }
        if (num === 0) {
            return '零'
        }

        if (!(/^\d+$/.test(s))) {
            throw new Error('Not a number')
        }
        if (s.length > 20) {
            throw new Error('Number is too large')
        }
        let digitList = s.split('')
        digitList.reverse()
        let splitNumList = []
        let l = digitList.splice(0, 4)
        while (l.length) {
            splitNumList.push(l)
            l = digitList.splice(0, 4)
        }
        let hanzi = ''
        splitNumList.forEach((arr, i) => {
            let rst = ''
            arr.forEach((digit, j) => {
                rst = hanziNum[digit] + suffix[j] + rst
            })
            rst += units[i % 6]
            hanzi = rst + hanzi
        })
        suffix.forEach(item => (hanzi = hanzi.replaceAll('零' + item, '零')))
        for (let i = units.length - 1; i >= 0; --i) {
            let val = units[i]
            hanzi = hanzi.replace(new RegExp('(零+)' + val, 'g'), (match, $1) => ($1.length === 4 ? '' : val))
        }
        hanzi = hanzi.replace(/零+/g, '零')
        hanzi = hanzi.replaceAll("个", '')
        hanzi = hanzi.replaceStart("一十", '十')
        return hanzi
    }

    /**
     * @param {string} s
     * @return {string}
     */
    static toPascalCase(s) {
        s = fmt.toCamelCase(s)
        return s[0].toUpperCase() + s.substring(1)
    }

    /**
     * Convert to sentence-case
     * @param {string} s
     * @param {boolean} handleCases
     * @return {string}
     */
    static toSentenceCase(s, handleCases = false) {
        if (handleCases) {
            s = fmt.toSnakeCase(s).replaceAll('_', ' ')
        }
        return !s ? "" : s[0].toUpperCase() + s.substring(1)
    }

    /**
     * Convert UPPER_UNDERSCORE_CASE/PascalCase/camelCase/kebab-case to lower-case snake case(underscore_case)
     * @param {string} s
     * @return {string}
     */
    static toSnakeCase(s) {
        s = s.replaceAll('-', '_')  // kebab-case
        let isPascal = s && (s[0] >= 'A' && s[0] <= 'Z')

        s = s.replace(/_?([A-Z]+)/g, function (x, y) {
            return "_" + y.toLowerCase()
        })
        return isPascal ? s.trimStart('_', 1) : s
    }
}