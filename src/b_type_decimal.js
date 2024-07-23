// @import decimal.Scale
class decimal {
    name = 'aa-decimal'

    static Scale = 4  // 万分之一   Math.pow(10, decimal.Scale)
    static Unit = Math.pow(10, decimal.Scale)
    static Max = parseInt("".padEnd((Math.ceil(Number.MAX_SAFE_INTEGER / 10) + '').length, "9")) // 最多支持999亿.9999


    type = "decimal"
     // https://www.splashlearn.com/math-vocabulary/decimals/decimal-point
    // https://learn.microsoft.com/en-us/sql/t-sql/data-types/precision-scale-and-length-transact-sql?view=sql-server-ver16
    // [whole -> precision - scale][decimal point = .][mantissa -> scale]
    value     // 值
    // mantissa // 小数值
    // whole // 整数值
    //precision   // 精度，如 12345.6789.precision   ==> 9 = len('12345') + len('6789')
    scale = decimal.Scale// 小数位数，如 12345.6789.scale  ==> 4 = len('6789')
    rounder = Math.round   // 取整方式 ceil -> round up;  floor -> round down


    /**
     *
     * @param {money|number|string} vv
     * @param {string} [vk]
     */
    constructor(vv, vk = void '') {
        // 子类继承后，也能通过该判断。即子类 instance of 父类 也是true
        if (vv instanceof decimal) {
            return vv   // js constructor 可以返回
        }
        vv = Math.floor(number(vv, vk))
        this.value = vv
    }


    /**
     * 设置精度（即小数位数）
     * @param {number} scale
     */
    setScale(scale) {
        scale = number(scale)
        if (scale < 0 || scale > decimal.Scale) {
            scale = decimal.Scale
        }
        this.scale = scale
        return this
    }

    setRounder(rounder) {
        this.rounder = rounder
        return this
    }

    clone() {
        return new decimal(this.value).setScale(this.scale).setRounder(this.rounder)
    }

    plus(n) {
        this.value = this.rounder(this.value + n)
        return this
    }

    minus(n) {
        this.value = this.rounder(this.value - n)
        return this
    }

    multiply(n) {
        this.value = this.rounder(this.value * n)
        return this
    }

    div(n) {
        this.value = this.rounder(this.value / n)
        return this
    }

    // 精度
    precision() {
        return String(Math.abs(this.value)).length
    }

    // 实数值
    real() {
        return this.value / Math.pow(10, this.scale)
    }

    /**
     * 整数部分值
     * @returns {number}
     */
    whole() {
        if (this.value === 0) {
            return 0
        }
        let w = this.value / Math.pow(10, this.scale)
        return this.value < 0 ? Math.ceil(w) : Math.floor(w)
    }


    /**
     * 小数值  -->  使用小数表示，不能用整数，因为  123.0001
     * @param withSign
     * @returns {number}
     */
    mantissa(withSign = false) {
        let s = String(Math.abs(this.value))
        let a = s.length - this.scale
        if (a > 0) {
            s = s.substring(a)
        }
        s = '0.' + s
        if (withSign && this.value < 0) {
            s = '-' + s
        }
        return Number(s)
    }


    /**
     * 整数部分字符形式表示
     * @param {number} segmentSize 整数部分每segmentSize位使用separator隔开
     * @param {string} separator
     * @returns {string|number}
     */
    formatWhole(segmentSize = 0, separator = ',') {
        let w = this.whole()
        if (!segmentSize) {
            return String(w)
        }
        return math.thousands(w, segmentSize, separator)
    }



    /**
     *
     * @param {number} scale    是否截断小数尾部0
     * @param {boolean} trimScale
     * @param {('floor'|'round'|'ceil')} scaleRound   @warn 如果进位到整数，则只保留.999...；负数按正数部分round
     * @returns {string}
     */
    formatMantissa(scale = 0, trimScale = false, scaleRound = 'floor') {
        let s = String(Math.abs(this.value))
        let a = s.length - this.scale
        if (a > 0) {
            s = s.substring(a) // 取小数部分
        }
        let ok = false;

        [s, ok] = decimal.#mantissaOk(s, scale, trimScale)
        if (!ok) {
            return s
        }

        if (s.length > scale) {
            let b = scale > 0 ? s[scale - 1] : s[s.length - 1]
            let g = scaleRound === 'ceil' || (scaleRound === 'round' && Number(b) > 4)   //  进位判断
            s = s.substring(0, scale)
            if (g) {
                // 0.999... 不用进位
                if (!/^9+$/.test(s)) {
                    let n = Number('1' + s) + 1
                    s = String(n).substring(1)
                }
            }
            // s 发生变化
            [s, ok] = decimal.#mantissaOk(s, scale, trimScale)
            if (!ok) {
                return s
            }
        }
        return '.' + s
    }

    /**
     * @param {number|{segmentSize?: number, scale?: number, separator?: string, trimScale?: boolean, scaleRound?: ("floor"|"round"|"ceil")}} [style]
     * @returns {string}
     */
    format(style = void null) {
        style = decimal.#newStyle(style)
        return this.formatWhole(style.segmentSize, style.separator) + this.formatMantissa(style.scale, style.trimScale, style.scaleRound)
    }
    /**
     * @param {number|{segmentSize?: number, scale?: number, separator?: string, trimScale?: boolean, scaleRound?: ("floor"|"round"|"ceil")}} [style]
     * @returns {{segmentSize: number, scale: number, separator: string, trimScale: boolean, scaleRound: ('floor'|'round'|'ceil')}}
     */
    static #newStyle(style = void null) {
        let t = {
            segmentSize: 0,  // 整数部分每segmentSize位使用separator隔开
            separator  : ",", // 整数部分分隔符，如英文每3位一个逗号；中文每4位一个空格等表示方法
            scale      : 0, // 保留小数位数，0则表示不限制
            trimScale  : false,  // 是否删除小数尾部无效的0
            scaleRound : 'floor',  //('floor'|'round'|'ceil')   @warn 如果进位到整数，则只保留.999...；负数按正数部分round
        }
        if (!style) {
            return t
        }
        if (typeof style === "number") {
            t.scale = style
            return t
        }
        return map.strictMerge(t, style)
    }


    static #mantissaOk(s, scale = 0, trimScale = false) {
        if (trimScale || scale === 0) {
            s = s.replace(/0+$/g, '')
        } else if (len(s) < scale) {
            s = s.padEnd(scale, '0')
        }
        if (s === "") {
            return ["", false]
        } else if (scale === 0 || len(s) <= scale) {
            return ["." + s, false]
        }
        return [s, true]
    }

}