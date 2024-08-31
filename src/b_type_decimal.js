/** @typedef {number|{segmentSize?: number, scale?: number, separator?: string, trimScale?: boolean, scaleRound?: "floor"|"round"|"ceil"}} DecimalFormatSettings */

/** @typedef {Decimal|Money|Percent|VMoney} DecimalT */
/**
 * @class
 * @template T
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
        this.value = this.rounder(number(...args))
    }


    /**
     * Set rounder for this instance
     * @param {function} rounder
     * @return {this}
     */
    setRounder(rounder) {
        this.rounder = rounder
        return this
    }

    /**
     * @param {number} [value]
     * @return {T}
     */
    clone(value) {
        value = value ? Number(value) : this.value
        const self = this.constructor  // 使用 this.constructor(). 可以传递到子类
        return new self(value).setRounder(this.rounder)
    }


    /**
     * @param {DecimalT} n
     * @return {this}
     * @throws {TypeError}
     */
    plus(n) {
        panic.errorType(n, this.constructor)
        if (n.constructor === this.constructor) {
            this.value += n.valueOf()
            return this
        }
        if (n.group === this.group) {
            this.value += n.toReal() * this.units
            return this
        }

        throw new TypeError(`${this.constructor.name} plus ${n.constructor.name} is not allowed`)
    }


    /**
     * @param {DecimalT} n
     * @return {this}
     * @throws {TypeError}
     */
    minus(n) {
        panic.errorType(n, this.constructor)
        if (n.constructor === this.constructor) {
            this.value -= n.valueOf()
            return this
        }
        if (n.group === this.group) {
            this.value -= n.toReal() * this.units
            return this
        }

        throw new TypeError(`${this.constructor.name} minus ${n.constructor.name} is not allowed`)
    }


    /**
     * @template T
     * @param {T} n
     * @return {this|T}
     * @throws {TypeError}
     */
    multiply(n) {
        panic.errorType(n, Decimal)
        // @T*Decimal => @T; @T*Percent => @T
        if (n.group === 'decimal') {
            this.value = this.rounder(this.value * n.units / n.value)
            return this
        }

        // @Decimal*T => T; @Percent*T => T
        if (this.group === 'decimal') {
            const newN = n.clone()
            newN.value = newN.rounder(newN.value * this.units / this.value)
            return newN
        }

        throw new TypeError(`${this.constructor.name} multiply ${n.constructor.name} is not allowed`)
    }


    /**
     * @param {DecimalT} n
     * @return {this|Decimal}
     * @throws {TypeError}
     */
    divide(n) {
        panic.errorType(n, Decimal)
        if (n.value === 0) {
            throw new TypeError(`0 cannot be a dividend`)
        }

        // @T/Decimal => @T; @T/Percent => @T
        if (n.group === 'decimal') {
            // (this.toReal() / n.toReal()) * this.units = ((this.value/this.units) / (n.value/n.units)) * this.units
            this.value = this.rounder(this.value * n.units / n.value)
            return this
        }

        // @Money/Money => Decimal; @VMoney/VMoney => Decimal
        if (n.constructor === this.constructor) {
            return decimal(this.value * Decimal.Units / n.value)
        }
        // @Money/VMoney => Decimal; @VMoney/Money => Decimal
        if (n.group === this.group) {
            return decimal(this.value * n.units * Decimal.Units / (n.value * this.units))
        }

        throw new TypeError(`${this.constructor.name} div ${n.constructor.name} is not allowed`)
    }


    /**
     * @param {DecimalT} n
     * @return {this|Decimal}
     * @throws {TypeError}
     */
    beDivided(n) {
        panic.errorType(n, Decimal)
        if (this.value === 0) {
            throw new RangeError(`0 cannot be a dividend`)
        }
        // T/@Decimal => T; T/@Percent => T
        if (this.group === 'decimal') {
            // Decimal/@Decimal => @Decimal; Percent/@Decimal => @Decimal
            if (n.group !== 'decimal') {
                // (n.toReal() / this.toReal()) * this.units = ((n.value/n.units) / (this.value/this.units)) * this.units
                this.value = this.rounder(n.value * this.units * this.units / (this.value * n.units))
                return this
            }
            return n.clone().divide(this)
        }
        // Money/@Money => Decimal; VMoney/@VMoney => Decimal
        if (n.constructor === this.constructor) {
            return decimal(n.value * Decimal.Units / this.value)
        }
        if (n.group === this.group) {
            return decimal(n.value * this.units * Decimal.Units / (this.value * n.units))
        }
        throw new TypeError(`${this.constructor.name} div ${n.constructor.name} is not allowed`)
    }

    beDividedInt(n) {
        return this.beDivided(this.clone(n * this.units))
    }

    divideInt(n) {
        return this.divide(this.clone(n * this.units))
    }

    multiplyInt(n) {
        return this.multiply(this.clone(n * this.units))
    }

    minusInt(n) {
        return this.minus(this.clone(n * this.units))
    }

    plusInt(n) {
        return this.plus(this.clone(n * this.units))
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

        [s, ok] = this.constructor.mantissaOk(s, scale, trimScale)
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
            [s, ok] = this.constructor.mantissaOk(s, scale, trimScale)
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
        settings = this.constructor.newFormatSettings(settings)
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
     * Convert the remainder of division of multiple real numbers to DecimalT
     * @param {number} dividend
     * @param {number} divisors
     * @return {this}
     */
    static divideReal(dividend, ...divisors) {
        const self = this  // 使用 this （不能用 this.constructor()). 可以传递到子类
        let v = dividend * self.Units
        divisors.map(d => {
            v /= d
        })
        return new self(v)
    }

    /**
     * Convert the difference of multiple real numbers to DecimalT
     * @param {number} minuend
     * @param {number} subtrahends
     * @return {Decimal}
     */
    static minusReal(minuend, ...subtrahends) {
        const self = this  // 使用 this （不能用 this.constructor()). 可以传递到子类
        let v = minuend
        subtrahends.map(d => {
            v -= d
        })
        return new self(v * self.Units)
    }

    /**
     * Convert the product of multiple real numbers to DecimalT
     * @param {number} multiplicand
     * @param {number} multipliers
     * @return {this}
     */
    static multiplyReal(multiplicand, ...multipliers) {
        const self = this  // 使用 this （不能用 this.constructor()). 可以传递到子类
        let v = multiplicand * self.Units
        multipliers.map(m => {
            v *= m
        })
        return new self(v)
    }

    /**
     * Convert the sum of multiple real numbers to Decimal
     * @param {number} addend
     * @param {number} adders
     * @return {this}
     */
    static plusReal(addend, ...adders) {
        const self = this  // 使用 this （不能用 this.constructor()). 可以传递到子类
        let v = addend
        adders.map(d => {
            v += d
        })
        return new self(v * self.Units)
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
     * Convert real number to DecimalT
     * @param {number} num
     * @return {this}
     */
    static real(num) {
        const self = this  // 使用 this （不能用 this.constructor()). 可以传递到子类
        const units = self.Units
        return new self(num * units)
    }

    /**
     * @param {str} str
     * @return {this}
     * @note compatible with this.serialize()
     */
    static unserialize(str) {
        const self = this  // 使用 this （不能用 this.constructor()). 可以传递到子类
        return new self(int54(str))  // 使用 this.constructor(). 可以传递到子类
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
