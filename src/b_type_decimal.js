/**
 * @typedef {number|{segmentSize?: number, scale?: number, separator?: string, trimScale?: boolean, scaleRound?: "floor"|"round"|"ceil"}} DecimalFormatSettings
 */
class Decimal {
    name = 'aa-decimal'


    static Scale = 4  // 万分之一   Math.pow(10, Decimal.Scale)
    static Units = Math.pow(10, Decimal.Scale)
    static Max = parseInt("".padEnd((Math.ceil(Number.MAX_SAFE_INTEGER / 10) + '').length, "9")) // 最多支持999亿.9999
    static Rounder = Math.round

    type = 'decimal'
    group = 'decimal'
    // https://www.splashlearn.com/math-vocabulary/Decimals/Decimal-point
    // https://learn.microsoft.com/en-us/sql/t-sql/data-types/precision-scale-and-length-transact-sql?view=sql-server-ver16
    // [whole -> precision - scale][Decimal point = .][mantissa -> scale]
    value     // 值
    // mantissa // 小数值
    // whole // 整数值
    //precision   // 精度，如 12345.6789.precision   ==> 9 = len('12345') + len('6789')
    // 私有变量禁止 this 传递，所以要保持 protected


    scale = Decimal.Scale
    units = Decimal.Units
    rounder = Decimal.Rounder   // 取整方式 ceil -> round up;  floor -> round down



    /**
     * @param {vv_vk_defaultV} [args]
     */
    constructor(...args) {
        this.value = Math.floor(number(...args))
    }


    /**
     * Set rounder for this instance
     * @param {function} rounder
     * @return {Decimal}
     */
    setRounder(rounder) {
        this.rounder = rounder
        return this
    }


    clone() {
        const self = this.constructor  // 使用 this.constructor(). 可以传递到子类
        return new self(this.value).setRounder(this.rounder)
    }


    /**
     * @param {Decimal|number} n
     * @return {Decimal}
     */
    plus(n) {
        if (typeof n === "number") {
            this.value = this.rounder(this.value + n)
            return this
        }

        if (!(n instanceof Decimal)) {
            throw new TypeError(`${this.name} plus ${n} is invalid`)
        }

        if (n.name === this.name) {
            this.value += n.valueOf()
            return this
        }
        if (n.group === this.group) {
            this.value += n.toReal() * this.units
            return this
        }

        throw new TypeError(`${this.name} plus ${n.name} is not allowed`)
    }

    plusUnitsX(n) {
        return this.plus(n * this.units)
    }

    /**
     * @param {Decimal|number} n
     * @return {Decimal}
     */
    minus(n) {
        if (typeof n === "number") {
            this.value = this.rounder(this.value - n)
            return this
        }

        if (n.name === this.name) {
            this.value -= n.valueOf()
            return this
        }
        if (n.group === this.group) {
            this.value -= n.toReal() * this.units
            return this
        }

        throw new TypeError(`${this.name} minus ${n.name} is not allowed`)
    }

    minusUnitsX(n) {
        return this.minus(n * this.units)
    }

    /**
     * @param {Decimal|number} n
     * @return {Decimal}
     */
    multiply(n) {
        if (typeof n === "number") {
            this.value = this.rounder(this.value * n / this.units)
            return this
        }


        // money * decimal ==> money, decimal * decimal ==> decimal
        if (n.group === 'decimal') {
            this.value = this.rounder(this.value * n.toReal())
            return this
        }

        // decimal * money ==> money
        if (this.group === 'decimal') {
            const newN = n.clone()
            newN.value = newN.rounder(newN.value * this.toReal())
            return newN
        }

        throw new TypeError(`${this.name} multiply ${n.name} is not allowed`)
    }

    multiplyUnitsX(n) {
        return this.multiply(n * this.units)
    }

    /**
     * @param {Decimal|number} n
     * @return {Decimal}
     */
    divide(n) {
        if (n === 0) {
            throw new RangeError(`zero can't be a dividend`)
        }

        if (typeof n === "number") {
            this.value = this.rounder(this.value * this.units / n)
            return this
        }


        // money / decimal ==> money, decimal / decimal ==> decimal
        if (n.group === 'decimal') {
            this.value = this.rounder(this.value / n.toReal())
            return this
        }
        // decimal /decimal ==> decimal, money / money ===> money
        if (n.name === this.name) {
            return decimal(this.value * Decimal.Units / n.valueOf())
        }
        if (n.group === this.group) {
            return decimal(this.toReal() * Decimal.Units / n.toReal())
        }

        throw new TypeError(`${this.name} div ${n.name} is not allowed`)
    }

    divideUnitsX(n) {
        return this.divide(n * this.units)
    }

    /**
     * @param {Decimal|number} n
     * @return {Decimal}
     */
    beDivided(n) {
        if (this.value === 0) {
            throw new RangeError(`${n}/0 zero can't be a dividend`)
        }

        if (typeof n === "number") {
            n *= this.units
            this.value = this.rounder(n / this.value)
            return this
        }

        // money / [decimal] ==> money, decimal / [decimal] ==> decimal
        if (this.group === 'decimal') {
            let newN = n.clone()
            newN.value = this.rounder(newN.value / this.toReal())
            return this
        }
        // decimal /decimal ==> decimal, money / money ===> money
        if (n.name === this.name) {
            return decimal(n.valueOf() * Decimal.Units / this.value)
        }
        if (n.group === this.group) {
            return decimal(n.toReal() * Decimal.Units / this.toReal())
        }

        throw new TypeError(`${this.name} div ${n.name} is not allowed`)
    }

    // 精度
    precision() {
        return String(Math.abs(this.value)).length
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
     * @param {boolean} withSign
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
     * @returns {string}
     */
    formatWhole(segmentSize = 0, separator = ',') {
        let w = this.whole()
        if (!segmentSize) {
            return String(w)
        }
        return maths.thousands(w, segmentSize, separator)
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

        [s, ok] = Decimal.mantissaOk(s, scale, trimScale)
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
            [s, ok] = Decimal.mantissaOk(s, scale, trimScale)
            if (!ok) {
                return s
            }
        }
        return '.' + s
    }

    /**
     * @param {number|DecimalFormatSettings} [settings]
     * @returns {string}
     */
    format(settings) {
        settings = Decimal.newFormatSettings(settings)
        return this.formatWhole(settings.segmentSize, settings.separator) + this.formatMantissa(settings.scale, settings.trimScale, settings.scaleRound)
    }

    fmt(scale = 2, trimScale = true) {
        return this.format({
            trimScale: trimScale,
            scale    : scale,
        })
    }

    info() {
        return `${this.toReal()} (${this.type}:${this.group} ${this.value})`
    }

    toCeil() {
        return Math.ceil(this.toReal())
    }

    toFloor() {
        return Math.floor(this.toReal())
    }

    // 实数值
    toReal() {
        return this.value / this.units
    }

    toRound() {
        return Math.round(this.toReal())
    }

    valueOf() {
        return this.value
    }

    serialize() {
        return String(this.value)
    }

    toJSON() {
        return String(this.value)
    }

    /**
     * Divide two numbers and convert its result to Decimal
     * @param {number} a
     * @param {number} b
     * @return {typeof Decimal}
     */
    static div(a, b) {
        const self = this  // 使用 this （不能用 this.constructor()). 可以传递到子类
        const units = self.Units
        return new self(a * units / b) // 使用 this （不能用 this.constructor()). 可以传递到子类
    }

    /**
     * @param {number|DecimalFormatSettings} [settings]
     * @returns {DecimalFormatSettings}
     * @protected
     */
    static newFormatSettings(settings) {
        let t = {
            segmentSize: 0,  // 整数部分每segmentSize位使用separator隔开
            separator  : ",", // 整数部分分隔符，如英文每3位一个逗号；中文每4位一个空格等表示方法
            scale      : 0, // 保留小数位数，0则表示不限制
            trimScale  : false,  // 是否删除小数尾部无效的0
            scaleRound : 'floor',  //('floor'|'round'|'ceil')   @warn 如果进位到整数，则只保留.999...；负数按正数部分round
        }
        if (!settings) {
            return t
        }
        if (typeof settings === "number") {
            t.scale = settings
            return t
        }
        return map.strictMerge(t, settings)
    }

    /**
     * @param {string} s
     * @param {number} scale
     * @param {boolean} trimScale
     * @return {(string|boolean)[]}
     * @protected
     */
    static mantissaOk(s, scale = 0, trimScale = false) {
        if (trimScale || scale === 0) {
            s = s.trimEnd('0')
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
    /**
     *
     * @param {number} num
     * @return {typeof Decimal}
     */
    static unitsX(num) {
        const self = this  // 使用 this （不能用 this.constructor()). 可以传递到子类
        const units = self.Units
        return new self(num * units)
    }

    /**
     * @param {str} str
     * @return {typeof Decimal}
     * @note compatible with this.serialize()
     */
    static unserialize(str) {
        return new this.constructor(int54(str))  // 使用 this.constructor(). 可以传递到子类
    }
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {Decimal}
 */
function decimal(...args) {
    const v = defval(...args)
    if (v instanceof Decimal) {
        return v
    }
    return new Decimal(v)
}
