class decimal {
    type = "decimal"
    scaleMax = C.DecimalScale
    // https://www.splashlearn.com/math-vocabulary/decimals/decimal-point
    // https://learn.microsoft.com/en-us/sql/t-sql/data-types/precision-scale-and-length-transact-sql?view=sql-server-ver16
    // [whole -> precision - scale][decimal point = .][mantissa -> scale]
    value     // 值
    // mantissa // 小数值
    // whole // 整数值
    //precision   // 精度，如 12345.6789.precision   ==> 9 = len('12345') + len('6789')
    scale = C.DecimalScale// 小数位数，如 12345.6789.scale  ==> 4 = len('6789')
    rounder = Math.round   // 取整方式 ceil -> round up;  floor -> round down


    /**
     *
     * @param {money|number|string} vv
     * @param {string} vk?
     */
    constructor(vv, vk = void 0) {
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
        if (scale < 0 || scale > this.scaleMax) {
            scale = this.scaleMax
        }
        this.scale = scale
        return this
    }

    setRounder(rounder) {
        this.rounder = rounder
    }

    clone() {
        return new decimal(this.value).setScale(this.scale).setRounder(this.rounder)
    }

    plus(n) {
        this.value = this.rounder(this.value + n)
    }

    minus(n) {
        this.value = this.rounder(this.value - n)
    }

    multiply(n) {
        this.value = this.rounder(this.value * n)
    }

    div(n) {
        this.value = this.rounder(this.value / n)
    }

    /**
     * 整数部分值
     * @returns {number}
     */
    whole() {
        return Math.floor(this.value / Math.pow(10, this.scale))
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


    // 精度
    precision() {
        return String(Math.abs(this.value)).length
    }

    /**
     * 整数部分字符形式表示
     * @param {number} n 每n位使用逗号隔开
     * @returns {string|number}
     */
    formatWhole(n = 0) {
        let w = this.whole()
        if (!n) {
            return String(w)
        }
        return _aaMath.thousands(w, n, ',')
    }

    /**
     *
     * @param {number} padlen    是否截断小数尾部0
     * @returns {string}
     */
    formatMantissa(padlen = 0) {
        let s = String(Math.abs(this.value))
        let a = s.length - this.scale
        if (a > 0) {
            s = s.substring(a)
        }
        s = s.replace(/0+$/g, '').padEnd(padlen, '0')
        return s === "" ? "" : ('.' + s)
    }

    /**
     *
     * @param {number} padlen
     * @param n
     * @returns {string}
     */
    format(padlen = 0, n = 0) {
        return this.formatWhole(n) + this.formatMantissa(padlen)
    }

}