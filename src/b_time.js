/**
 * @typedef {string} DateString
 * @typedef {string} DatetimeString
 * @typedef {time|Date|DateString|DatetimeString|number} TimeParam
 */
class AaDateZero extends Date {
    name = 'aa-date-zero'
    value = '0000-00-00 00:00:00'


    // @param {string} date
    constructor(date = '0000-00-00 00:00:00') {
        super(date)
        this.value = date
    }


    getFullYear() {
        return 0
    }

    getUTCFullYear() {
        return 0
    }

    getMonth() {
        return -1  // month start from 0;
    }

    getUTCMonth() {
        return -1
    }

    getDate() {
        return 0
    }

    getUTCDate() {
        return 0
    }

    getDay() {
        return 0
    }

    getUTCDay() {
        return 0
    }

    getHours() {
        return 0
    }

    getUTCHours() {
        return 0
    }

    getMinutes() {
        return 0
    }

    getUTCMinutes() {
        return 0
    }

    getSeconds() {
        return 0
    }

    getUTCSeconds() {
        return 0
    }

    getMilliseconds() {
        return 0
    }

    getUTCMilliseconds() {
        return 0
    }

    getTimezoneOffset() {
        return 0
    }


    toUTCString() {
        return this.value
    }

    toISOString() {
        return this.value
    }


    toDateString() {
        return this.value
    }

    toTimeString() {
        return this.value
    }

    toLocaleString() {
        return this.value
    }


    toLocaleDateString() {
        return this.value
    }

    toLocaleTimeString() {
        return this.value
    }


    valueOf() {
        return 0
    }

    valueOf() {
        return 0
    }

    toString() {
        return this.value
    }

    toJSON() {
        return this.value
    }

}

class AaDateString {
    name = 'aa-date-string'

    static minDatetime = '0000-00-00 00:00:00' // 当作配置，可以修改; date/year 等可以通过此解析出来，不用单独配置了
    static maxDatetime = '9999-12-31 23:59:59'

    static minYear = AaDateString.minDatetime.substring(0, 4)
    static minDate = AaDateString.minDatetime.substring(0, 10)
    static maxYear = AaDateString.maxDatetime.substring(0, 4)
    static maxDate = AaDateString.maxDatetime.substring(0, 10)

    static localTimezoneOffsetString = AaDateString.parseTimezoneOffsetString()
    static yearLen = 4 // len('0000')
    static dateLen = 10  // len('0000-00-00')
    static datetimeLen = 19   // len('0000-00-00 00:00:00')
    static yearPattern = /^\d{4}$/
    static datePattern = /^\d{4}-[01]\d-[03]\d$/
    static datetimePattern = /^\d{4}-[01]\d-[03]\d[\sT][0-2]\d:[0-5]\d:[0-5]\d$/


    timezoneOffset
    #value = ""
    raw = ""

    get value() {
        return this.#value
    }

    set value(value) {
        this.init(value)
    }

    /**
     *
     * @param {string} s
     * @param {string} [zone]
     */
    init(s, zone = AaDateString.localTimezoneOffsetString) {
        this.raw = s

        if (["", "null", "invalid date", "invalid time value"].includes(s.toLowerCase())) {
            return
        }

        if (/[^\d:\-+.T\s]/.test(s)) {
            // local time sting
            try {
                const date = new Date(s)
                this.timezoneOffset = AaDateString.parseTimezoneOffsetString(date.getTimezoneOffset())
                this.#value = new time(date).format('YYYY-MM-DD HH:II:SS')
                return
            } catch (err) {
                throw new TypeError(`invalid time string ${s}`)
            }
        }

        s = s.replace(' ', 'T')
        let reg = /[-+][01]\d:[0-5]\d$/
        let zm = s.match(reg)
        if (zm) {
            zone = zm[0]
            s = s.replace(reg, '')
        }
        if (!zone) {
            zone = AaDateString.localTimezoneOffsetString
        }

        if (AaDateString.datetimePattern.test(s)) {
            s += '.000' + zone
        } else if (AaDateString.datePattern.test(s)) {
            s += 'T00:00:00.000' + zone
        } else if (AaDateString.yearPattern.test(s)) {
            s += '-01-01T00:00:00.000' + zone
        }
        this.timezoneOffset = zone
        this.#value = s
    }

    /**
     *
     * @param {string} s  {YYYY|YYYY-MM-DD|YYYY-MM-DD HH:II:SS}
     * @param {string} [zone]
     */
    constructor(s, zone = AaDateString.localTimezoneOffsetString) {
        this.init(s, zone)
    }


    isYear() {
        return AaDateString.yearPattern.test(this.raw)
    }

    isDate() {
        return AaDateString.datePattern.test(this.raw)
    }

    isDatetime() {
        return AaDateString.datetimePattern.test(this.raw)
    }

    isZero() {
        return this.#value.indexOf("0000-00-00T00:00:00.000") === 0
    }

    isMin(includeZero = true) {
        const d = AaDateString
        const v = this.#value
        if (includeZero && this.isZero()) {
            return true
        }
        if (this.isYear()) {
            return v.substring(0, d.yearLen) === d.minYear
        }
        if (this.isDate()) {
            return v.substring(0, d.dateLen) === d.minDate
        }
        return v.substring(0, d.datetimeLen) === d.minDatetime
    }

    isMax() {
        const d = AaDateString
        const v = this.#value
        if (this.isYear()) {
            return v.substring(0, d.yearLen) === d.maxYear
        }
        if (this.isDate()) {
            return v.substring(0, d.dateLen) === d.maxDate
        }
        return v.substring(0, d.datetimeLen) === d.maxDatetime
    }

    year() {
        return this.#value.substring(0, 4)
    }

    month() {
        return this.#value.substring(5, 7)
    }

    day() {
        return this.#value.substring(8, 10)
    }

    hour() {
        return this.#value.substring(11, 13)
    }

    minute() {
        return this.#value.substring(14, 16)
    }

    second() {
        return this.#value.substring(17, 19)
    }

    millisecond() {
        return this.#value.substring(19)
    }


    #toZero() {
        if (this.isYear()) {
            return '0000'
        }
        if (this.isDate()) {
            return '0000-00-00'
        }
        return '0000-00-00 00:00:00'
    }

    date() {
        return this.isZero() ? new AaDateZero(this.#toZero()) : new Date(this.#value)
    }

    valueOf() {
        return this.date().valueOf()
    }

    toString() {
        return this.#value
    }

    toJSON() {
        return this.#value
    }

    static setMinDatetime(datetime) {
        AaDateString.minDatetime = datetime
        AaDateString.minYear = datetime.substring(0, 4)
        AaDateString.minDate = datetime.substring(0, 10)
    }

    static setMaxDatetime(datetime) {
        AaDateString.maxDatetime = datetime
        AaDateString.maxYear = datetime.substring(0, 4)
        AaDateString.maxDate = datetime.substring(0, 10)
    }

    /**
     * 将秒数转为 II:SS 格式，或者把分钟数转为 HH:II格式
     * @param {number} t
     * @return {string}
     */
    static formatTime(t) {
        let s = t < 0 ? "-" : ""
        t = Math.abs(t)
        let hm = Math.floor(t / 60)
        t %= 60
        s += String(hm).padStart(2, "0")
        s += ":"
        s += String(t).padStart(2, "0")
        return s
    }

    /**
     *
     * @param {string|Date|number} [offset]
     * @return {string}
     */
    static parseTimezoneOffsetString(offset) {
        if (offset && typeof offset === "string") {
            if (!['-', '+'].includes(offset[0])) {
                offset = '+' + offset
            }
            return offset
        }
        if (offset instanceof Date) {
            offset = offset.getTimezoneOffset()
        } else if (typeof offset !== "number") {
            offset = new Date().getTimezoneOffset()
        }
        return offset < 0 ? "+" + AaDateString.formatTime(-offset) : "-" + AaDateString.formatTime(offset)
    }

}

// 253402271999000 = new Date("9999-12-31 23:59:59")
// 253402214400000 = new Date("9999-12-31")
class AaDateValidator {
    name = 'aa-date-validator'

    // support '1000-01-01' to '9999-12-31'
    static InvalidDate = 'invalid date'
    static ZeroYear = 'zero year'  // 0000
    static MinYear = 'zero year'
    static MaxYear = 'zero year'
    static ZeroDate = 'zero date'    // 0000-00-00
    static MinDate = 'minimum date'
    static MaxDate = 'maximum date'
    static ZeroDatetime = 'zero datetime'   //    0000-00-00 00:00:00
    static MinDatetime = 'minimum datetime'
    static MaxDatetime = 'maximum datetime'
    static ValidDate = 'valid date'


    static #minYearTs = new AaDateString(AaDateString.minDatetime.substring(0, 4) || '0000').valueOf()
    static #maxYearTs = new AaDateString(AaDateString.maxDatetime.substring(0, 4) || '9999').valueOf()
    static #minDateTs = new AaDateString(AaDateString.minDatetime.substring(0, 10) || '0000-00-00').valueOf()
    static #maxDateTs = new AaDateString(AaDateString.maxDatetime.substring(0, 10) || '9999-12-31').valueOf()
    static #minDatetimeTs = new AaDateString(AaDateString.minDatetime || '0000-00-00 00:00:00').valueOf()
    static #maxDatetimeTs = new AaDateString(AaDateString.maxDatetime || '9999-12-31 23:59:59').valueOf()


    #type

    get type() {
        return this.#type
    }


    /**
     *
     * @param {AaDateValidator|AaDateString|string|number|Date} value
     * @param {boolean} strict
     */
    init(value, strict = true) {
        if (value instanceof AaDateValidator) {
            this.#type = value.type
            return
        }


        const d = AaDateValidator
        value = typeof value === "string" ? new AaDateString(value) : value
        if (value instanceof AaDateString) {
            if (value.isZero()) {
                this.#type = value.isYear() ? d.ZeroYear : (value.isDate() ? d.ZeroDate : d.ZeroDatetime)
                return
            }
            if (value.isMin(strict)) {
                this.#type = value.isYear() ? d.MinYear : (value.isDate() ? d.MinDate : d.MinDatetime)
                return
            }
            if (value.isMax()) {
                this.#type = value.isYear() ? d.MaxYear : (value.isDate() ? d.MaxDate : d.MaxDatetime)
                return
            }
            value = value.toString()
        }


        // new Date() not yet thrown an exception.  but .toString() may throw
        try {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Invalid_date
            // RangeError: Invalid time value (V8-based)
            // RangeError: invalid date (Firefox)
            // RangeError: Invalid Date (Safari)

            const v = value instanceof Date ? value.valueOf() : new Date(value).valueOf()
            if (isNaN(v)) {
                this.#type = d.InvalidDate
                return
            }
            switch (v) {
                case d.#minYearTs:
                    this.#type = d.MinYear
                    break
                case d.#maxYearTs:
                    this.#type = d.MaxYear
                    break
                case d.#minDateTs:
                    this.#type = d.MinDate
                    break
                case d.#maxDateTs:
                    this.#type = d.MaxDate
                    break
                case d.#minDatetimeTs:
                    this.#type = d.MinDatetime
                    break
                case d.#maxDatetimeTs:
                    this.#type = d.MaxDatetime
                    break
                default:
                    this.#type = d.ValidDate
            }
        } catch (e) {
            this.#type = AaDateValidator.InvalidDate
        }
    }

    /**
     *
     * @param {AaDateString|string|number|Date} value
     * @param {boolean} strict
     */
    constructor(value, strict = true) {
        this.init(value, strict)
    }


    setInvalid() {
        this.#type = AaDateValidator.InvalidDate
    }


    isZero() {
        const d = AaDateValidator
        return [d.ZeroYear, d.ZeroDate, d.ZeroDatetime].includes(this.#type)
    }

    isMin(includeZero = true) {
        const d = AaDateValidator
        return [d.MinYear, d.MinDate, d.MinDatetime].includes(this.#type) || (includeZero && this.isZero())
    }

    isMax() {
        const d = AaDateValidator
        return [d.MaxYear, d.MaxDate, d.MaxDatetime].includes(this.#type)
    }

    isValid(includeMax = false) {
        const d = AaDateValidator
        return this.#type === d.ValidDate || (includeMax && this.isMax())
    }

    notValid(includeMax = false) {
        return !this.isValid(includeMax)
    }

}


class time {
    name = 'aa-time'
    /** @type {TimeUnit} */
    static Millisecond = 1
    /** @type {TimeUnit} */
    static Second = 1000 * time.Millisecond
    /** @type {TimeUnit} */
    static Minute = 60 * time.Second
    /** @type {TimeUnit} */
    static Hour = 60 * time.Minute
    /** @type {TimeUnit} */
    static Day = 24 * time.Hour


    /** @type {Date} */
    #date
    /** @type {AaDateValidator} */
    #validator = new AaDateValidator("Invalid Date")

    pattern = 'YYYY-MM-DD HH:II:SS'
    raw
    timezoneOffset = AaDateString.localTimezoneOffsetString

    /**
     *
     * @return {AaDateValidator}
     */
    get validator() {
        return this.#validator
    }

    // 不用报错，正常人也不会这么操作
    // set validator(value) {
    //     throw new SyntaxError("date validator is readonly")
    // }

    // @deprecated 外部修改无法及时改变 validator，因此不要暴露出去
    get date() {
        return this.#date
    }

    /**
     *
     * @param args
     * @return {(Date|time|string)[]}
     */
    #parseArgs(...args) {
        let l = args.length
        let offset = void ''
        if (l === 0) {
            return [new Date(), offset]
        }
        if (args[0] instanceof time || args[0] instanceof Date) {
            return [args[0], offset]
        }
        if (typeof args[0] === "undefined" || args[0] === null) {
            args[0] = new Date()
        }

        // parse zone
        if (l > 1 && args[l - 1] && typeof args[l - 1] === "string") {
            offset = args[l - 1]
            l--  // 移除最后一位
        }
        //  new time(year:number, month:number, day:number, hour?:number, minute?:number, second?:number, millisecond?:number, zone?:string)
        if (l > 1) {
            return [new Date(...args.slice(0, l)), offset]
        }
        let value = args[0]
        if (typeof value === "number") {
            return [new Date(value), offset]
        }

        return [value, offset]
    }

    // @param {Date|string|number} date
    init(...args) {
        let [value, offset] = this.#parseArgs(...args)
        if (offset) {
            this.timezoneOffset = offset
        } else {
            offset = this.timezoneOffset
        }

        this.raw = args.length === 1 ? args[0] : [...args]
        if (value instanceof time) {
            this.setPattern(value.pattern)
            this.validator.init(value.validator)
            this.#date = value.date
            return
        }

        this.resetPattern()

        // unix time
        if (typeof value === "string") {
            this.setPattern(value)
            let ds = new AaDateString(value, offset)
            this.validator.init(ds)
            if (this.validator.isMin()) {
                this.#date = new AaDateZero(value)
                return
            }
            value = new Date(ds.toString())
        }

        if (value instanceof Date) {
            this.#date = value
            this.validator.init(value)
            if (this.validator.isValid(true)) {
                this.timezoneOffset = offset  // set after valid date
            }
            return
        }
        value = new Date("Invalid Date")
        this.#date = value
        this.validator.setInvalid()
    }

    /**
     *

     * @param args
     *  date string:
     *      YYYY-MM-DDTHH:II:SS.sss+08:00       YYYY-MM-DD HH:II:SS.sss+08:00
     *      YYYY-MM-DDTHH:II:SS                 YYYY-MM-DD HH:II:SS
     *      YYYY-MM-DD        YYYY-MM            YYYY
     * @warn Chrome 支持  new Date('YYYY-MM-DD')  但是 safari 不支持！！Safari 需转换完整字符串：YYYY-MM-DD HH:II:SS.sss+08:00
     * @usage
     *  new time()
     *  new time(date:string, zone?:string)
     *  new time(timestamp:number, zone?string)   ---> new Date(millisecond)
     *  new time(year:number, month:number, day:number, hour?:number, minute?:number, second?:number, millisecond?:number, zone?:string)
     *  @throws {TypeError}
     */
    constructor(...args) {
        this.init(...args)
    }

    resetPattern() {
        this.pattern = 'YYYY-MM-DD HH:II:SS'
    }

    /**
     *
     * @param {string} pattern   YYYY-MM-DD HH:II:SS.sssZ  or  2024-07-15 00:00:00.000+08:00
     * @return {time}
     */
    setPattern(pattern) {
        if (/\d/.test(pattern)) {
            pattern = pattern.replace(/\+[01]\d:[0-5]\d/, 'Z')  // timezone

            let m = pattern.match(/\.\d+/)
            if (m) {
                pattern = pattern.replace(m[0], m[0].replace(/\d/g, 's'))  // milliseconds
            }
            m = pattern.match(/\d{4}-[01]\d-[0-3]\d/)
            if (m) {
                pattern = pattern.replace(m[0], 'YYYY-MM-DD')
            }
            m = pattern.match(/[02]\d:[0-5]\d:[0-5]\d/)
            if (m) {
                pattern = pattern.replace(m[0], 'HH:II:SS')
            }
        }
        this.pattern = pattern
        return this
    }


    // How many days in this month
    monthDays() {
        // new Date(2016, 2,1)  ===   2016-03-01 00:00:00  月份是从0开始
        // new Date(2016,2,0)  ===  2016-02-29 00:00:00    --> 3月1日前一天
        return new Date(this.year(), this.month(), 0).getDate()
    }

    toDatetimeString() {
        return this.format("YYYY-MM-DD HH:II:SS")
    }

    inChinese(withTime = false) {
        return withTime ? this.format("YYYY年M月D日 HH:II:SS") : this.format("YYYY年M月D日")
    }

    toDateString() {
        return this.format("YYYY-MM-DD")
    }

    toTimeString() {
        return this.format("HH:II:SS")
    }

    // Get the year
    year() {
        return this.#date.getFullYear()
    }

    // Get the real month, starts from 1
    month() {
        return this.#date.getMonth() + 1    // Date.getMonth 从0 开始
    }

    // Get the day-of-the-month
    day() {
        return this.#date.getDate()
    }

    // @return {(1|2|3|4|5|6|7)} Get the day of the week
    weekDay() {
        return this.#date.getDay()
    }

    hour() {
        return this.#date.getHours()
    }

    minute() {
        return this.#date.getMinutes()
    }

    second() {
        return this.#date.getSeconds()
    }

    millisecond() {
        return this.#date.getMilliseconds()
    }

    // timestamp in milliseconds.   +date  可以隐式调用 valueOf()
    valueOf() {
        if (this.validator.isMin()) {
            return 0
        }
        return this.#date.valueOf()
    }

    // 等同于 valueOf()
    // @deprecated
    // valueOf() {
    //     return this.#date.valueOf()
    // }
    //


    /**
     * Unix timestamp  https://en.wikipedia.org/wiki/Unix_time
     * @description the number of seconds which have passed since 1970-01-01 00:00:00
     * @return {number}
     */
    unix() {
        return Math.floor(this.valueOf() / time.Second)
    }


    // Get quarter-of-the-year
    quarter() {
        return Math.floor((this.#date.getMonth() + 3) / 3)
    }

    // Get week-of-the-year
    weekOfYear() {
        let d1 = new Date(this.year(), 0, 1) // 当年1月1日
        let x = Math.round((this - d1) / time.Day);
        return Math.ceil((x + d1.getDay()) / 7)
    }

    getTimezoneOffset() {
        return this.#date.getTimezoneOffset()
    }

    setTime(time) {
        return this.#date.setTime(time)
    }

    setMilliseconds(ms) {
        return this.#date.setMilliseconds(ms)
    }

    /**
     * set the seconds of the Date object using local time.
     * @param {number} sec
     * @param {number} [ms]
     * @return {number}
     * @warn new Date().setSeconds(2, void 0)  will return invalid date!
     */
    setSeconds(sec, ms) {
        return this.#date.setSeconds(...arguments)
    }

    /**
     * set the minutes of the Date object using local time.
     * @param {number} min
     * @param {number} [sec]
     * @param {number} [ms]
     * @return {number}
     * @warn new Date().setMinutes(2, void 0)  will return invalid date!
     */
    setMinutes(min, sec, ms) {
        return this.#date.setMinutes(...arguments)
    }

    /**
     *
     * @param {number} hours
     * @param {number} [min]
     * @param {number} [sec]
     * @param {number} [ms]
     * @return {number}
     * @warn new Date().setHours(2, void 0)  will return invalid date!
     */
    setHours(hours, min, sec, ms) {
        return this.#date.setHours(...arguments)
    }

    /**
     * Set the numeric day-of-the-month value of the Date object using local time.
     * @param {number} day
     * @return {number}
     */
    setDate(day) {
        return this.#date.setDate(day)
    }

    /**
     * Set the month value in the Date object using local time.
     * @param {number} month
     * @param {number} [day]
     * @return {number}
     * @warn new Date().setMonth(2, void 0)  will return invalid date!
     */
    setMonth(month, day) {
        return this.#date.setMonth(...arguments)
    }

    /**
     * Set the year of the Date object using local time.
     * @param {number} year
     * @param {number} [month]
     * @param {number} [day]
     * @return {number}
     * @warn new Date().setFullYear(2025, void 0)  will return invalid date!
     */
    setFullYear(year, month, day) {
        return this.#date.setFullYear(...arguments)
    }

    // YYYY-MM-DD HH:II:SS   YYYY-MM-DD HH:II:SS.sss
    // z ==> timezone
    format(s = "YYYY-MM-DD HH:II:SS") {
        if (this.#date instanceof AaDateZero) {
            return s.replace(/[YMDHISs]/g, '0').replace(/Z/g, this.timezoneOffset)
        }


        // padZero: 0 no pad;  > 0 pad left; < 0 pad right
        const o = {
            "Y+": [4, this.year()],// 年份-> 固定是4位
            "M+": [2, this.month()], //月份
            "D+": [2, this.day()], //日
            "H+": [2, this.hour()], //小时
            "I+": [2, this.minute()], //分
            "S+": [2, this.second()], //秒
            "Q+": [1, this.quarter()], //季度
            "s+": [-9, this.millisecond()],//毫秒   每一个表示一位精度，
            "Z" : [0, this.timezoneOffset],
        }

        for (let [k, u] of Object.entries(o)) {
            const padZero = u[0]
            const v = String(u[1])
            if (k === "Z") {
                s = s.replaceAll('Z', v)
                continue
            }

            let yt = new RegExp("(" + k + ")").exec(s)
            if (len(yt) < 2) {
                continue
            }
            let matchStr = yt[1]
            let l = matchStr.length
            let to = v
            if (padZero > 0 && l > 1) {
                to = ('0'.repeat(padZero) + v).slice(-l)
            } else if (padZero < 0) {
                to = v.padEnd(-padZero, '0').substring(0, l)
            }
            s = s.replace(matchStr, to)  // 用空格代替，方便手写
        }
        return s;
    }

    // Calculate date difference in days or business days between 2 dates.
    /**
     * 计算两个日期相隔： 年、月、日数
     * @param {time|Date|string|number} [d1]  default to now, a.k.a. new Date()
     */
    diff(d1) {
        return new TimeDiff(this, d1)
    }

    // 只保留特殊常用的函数，其他的如果需要用。就调用 xxx.date.xxxx 直接调用即可
    // @return {string}
    toString(invalidString = void '') {
        if (typeof invalidString !== "undefined" && !this.validator.isValid()) {
            return invalidString
        }
        return this.format(this.pattern)
    }

    // 用于json序列号
    toJSON() {
        return this.toString()
    }

    serialize() {
        return string(this.valueOf())
    }

    /**
     * @param {vv_vk_defaultV} [args]
     * @return {string|string}
     */
    static dateString(...args) {
        const v = defval(...args)
        if (v) {
            try {
                let d = new time(v)
                return d.toDateString()
            } catch (err) {
                console.error(err)
            }
        }

        return AaDateString.minDate
    }
    /**
     * @param {vv_vk_defaultV} [args]
     * @return {string|string}
     */
    static datetimeString(...args) {
        const v = defval(...args)
        if (v) {
            try {
                let d = new time(v)
                return d.toDatetimeString()
            } catch (err) {
                console.error(err)
            }
        }
        return AaDateString.minDatetime
    }

    static minDatetime() {
        return AaDateString.minDatetime
    }

    static setMinDatetime(datetime) {
        AaDateString.setMinDatetime(datetime)
    }

    static maxDatetime() {
        return AaDateString.maxDatetime
    }

    static setMaxDatetime(datetime) {
        AaDateString.setMaxDatetime(datetime)
    }

    /**
     * Unix timestamp  https://en.wikipedia.org/wiki/Unix_time
     * @description the number of seconds which have passed since 1970-01-01 00:00:00
     * @param {Date|string} date
     * @return {number}
     */
    static unix(date = new Date()) {
        return new time(date).unix()
    }

    /**
     * Extract the date string to YYYYMM style number
     * @param {time|Date|string} date
     * @return number
     */
    static toYearMonthNumber(date) {
        if (date instanceof time) {
            return parseInt(date.format('YYYYMM'))
        } else if (date instanceof Date) {
            return parseInt(date.getFullYear() + (' ' + date.getMonth() + 1).padStart(2, '0'))
        }
        let ds = new AaDateString(date)
        return parseInt(ds.year() + '' + ds.month())
    }

    /**
     * Compose Number(YYYYMM) to YYYY-MM string
     * @param {number} num
     * @return {string}
     */
    static toYearMonthString(num) {
        return num / 100 + "-" + num % 100
    }

    /**
     * @param {str} str
     * @return {time}
     * @note compatible with this.serialize()
     */
    static unserialize(str) {
        return new time(number(str))
    }
}


class TimeDiff {
    name = 'aa-date-difference'

    // differences in milliseconds
    valid = false
    diff

    yearsPart
    monthsPart
    daysPart
    hoursPart
    minutesPart
    secondsPart
    millisecondsPart

    /**
     * @param {TimeParam} [timeA] default to now()
     * @param {TimeParam} [timeB] default to now()
     */
    constructor(timeA, timeB) {
        const d0 = timeA instanceof time ? timeA : new time(timeA)
        const d1 = timeB instanceof time ? timeB : new time(timeB)  // new time(undfined) equals to new time(new Date())
        if (!d0.validator.isValid(true) || !d0.validator.isValid(true)) {
            log.error("date difference: invalid date", d0, d1)
            return
        }
        this.diff = d1.valueOf() - d0.valueOf()
        let yearsPart = d1.year() - d0.year()
        let monthsPart = d1.month() - d0.month()
        let daysPart = d1.day() - d0.day()
        let hoursPart = d1.hour() - d0.hour()
        let minutesPart = d1.minute() - d0.minute()
        let secondsPart = d1.second() - d0.second()
        let millisecondsPart = d1.millisecond() - d0.millisecond()
        if (millisecondsPart < 0) {
            secondsPart--
            millisecondsPart += 1000
        }
        if (secondsPart < 0) {
            minutesPart--
            secondsPart += 60
        }
        if (minutesPart < 0) {
            hoursPart--
            minutesPart += 60
        }
        if (hoursPart < 0) {
            daysPart--
            hoursPart += 24
        }
        if (daysPart < 0) {
            monthsPart--
            daysPart += d1.monthDays()
        }
        if (monthsPart < 0) {
            yearsPart--
            monthsPart = 12 + monthsPart
        }
        this.yearsPart = yearsPart
        this.monthsPart = monthsPart
        this.daysPart = daysPart
        this.hoursPart = hoursPart
        this.minutesPart = minutesPart
        this.secondsPart = secondsPart
        this.millisecondsPart = millisecondsPart
        this.valid = true
    }

    /**
     * Calculate the difference between these two date in years
     * @param {(((x:number)=>number)|Math.floor|Math.round|Math.ceil|RoundTrim|RoundReverse|RoundAway)} round
     * @return number
     */
    inYears(round = Math.round) {

        if (round.name === 'floor') {
            return this.yearsPart
        } else if (round.name === 'ceil') {
            let g = this.monthsPart > 0 || this.daysPart > 0 || this.hoursPart > 0 || this.minutesPart > 0 || this.secondsPart > 0 || this.millisecondsPart > 0
            return g ? this.yearsPart + 1 : this.yearsPart
        }
        return this.monthsPart > 6 ? this.yearsPart + 1 : this.yearsPart
    }

    /**
     * Calculate the difference between these two date in months
     * @param {(((x:number)=>number)|Math.floor|Math.round|Math.ceil|RoundTrim|RoundReverse|RoundAway)} round
     * @return number
     */
    inMonths(round = Math.round) {

        let months = this.yearsPart * 12 + this.monthsPart
        if (round.name === 'floor') {
            return months
        } else if (round.name === 'ceil') {
            let g = this.daysPart > 0 || this.hoursPart > 0 || this.minutesPart > 0 || this.secondsPart > 0 || this.millisecondsPart > 0
            return g ? months + 1 : months
        }
        return this.daysPart > 15 ? months + 1 : months
    }

    /**
     * Calculate the difference between these two date in days
     * @param {(((x:number)=>number)|Math.floor|Math.round|Math.ceil|RoundTrim|RoundReverse|RoundAway)} round
     * @return number
     */
    inDays(round = Math.round) {

        return round(this.diff / time.Day)
    }

    /**
     * Calculate the difference between these two date in hours
     * @param {(((x:number)=>number)|Math.floor|Math.round|Math.ceil|RoundTrim|RoundReverse|RoundAway)} round
     * @return number
     */
    inHours(round = Math.round) {

        return round(this.diff / time.Hour)
    }

    /**
     * Calculate the difference between these two date in minutes
     * @param {(((x:number)=>number)|Math.floor|Math.round|Math.ceil|RoundTrim|RoundReverse|RoundAway)} round
     * @return number
     */
    inMinutes(round = Math.round) {

        return round(this.diff / time.Minute)
    }

    /**
     * Calculate the difference between these two date in seconds
     * @param {(((x:number)=>number)|Math.floor|Math.round|Math.ceil|RoundTrim|RoundReverse|RoundAway)} round
     * @return number
     */
    inSeconds(round = Math.round) {

        return round(this.diff / time.Second)
    }

    inMilliseconds() {
        return this.diff
    }

    /**
     * Format date with specified formats
     * @param {string} layout
     * @param noCarry
     * @return {string}
     */
    format(layout, noCarry = false) {
        // "{%Y年}{%M个月}{%D天}
        if (!this.valid || this.diff < time.Second) {
            return ""
        }
        let p = {
            'Y': this.yearsPart,
            'M': this.monthsPart,
            'D': this.daysPart,
            'H': this.hoursPart,
            'I': this.minutesPart,
            'S': this.secondsPart
        }
        let ls = TimeDiff.loadDiff(layout, p)
        if (!noCarry) {
            p = TimeDiff.carryTimeDiff(p, ls)
        }

        if (p['Y'] > 0 && !ls['Y']) {
            p['M'] += p['Y'] * 12
            p['Y'] = 0
        }
        if (p['M'] > 0 && !ls['M']) {
            p['D'] += p['M'] * 30 // 近似天数
            p['M'] = 0
        }
        if (p['D'] > 0 && !ls['D']) {
            p['H'] += p['D'] * 24
            p['D'] = 0
        }
        if (p['H'] > 0 && !ls['H']) {
            p['I'] += p['H'] * 60
            p['H'] = 0
        }
        if (p['I'] > 0 && !ls['I']) {
            p['S'] += p['I'] * 60
            p['I'] = 0
        }

        let out = ""
        let n = layout.length
        let start = false
        let ignore = false
        for (let i = 0; i < n; i++) {
            let c = layout[i]
            if (start) {
                if (c === '}') {
                    start = false
                    ignore = false
                    continue
                }
                if (!ignore) {
                    out += c
                }
                continue
            }
            let r = layout[i + 2]
            if (c !== '{' || i > n - 3 || layout[i + 1] !== '%' || typeof p[r] !== "number") {
                out += c
                continue
            }

            if (p[r] === 0) {
                ignore = true
            } else {
                out += p[r]
            }
            i += 2
            start = true
        }
        return out
    }

    /**
     * Format date friendly
     * @param {string|struct} [dict]
     * @return {string}
     */
    formatFriendly(dict = 'zh-CN') {
        const Timeline = {
            translate: function (...args) {
                const pkg = {
                    'zh-CN': {
                        'Recently': '刚刚',
                        '%sm ago' : '%s分钟前',
                        '%sh ago' : '%s小时前',
                        '%sd ago' : '%s天前',
                        '%sw ago' : '%s周前',
                        '%smo ago': '%s个月前',
                        '%sy ago' : '%s年前',  // 最多1年前
                    }
                };
                const p = atype.isStruct(dict) ? dict : pkg[dict] ? pkg[dict] : null;
                return fmt.translate(p, ...args)
            }
        };

        const r = this.inSeconds()
        if (r < 60) {
            return Timeline.translate('Recently')
        } else if (r < 3600) {
            const n = Math.floor(r / 60);
            return Timeline.translate('%sm ago', n);
        } else if (r < 3600 * 24) {
            const n = Math.floor(r / 3600);
            return Timeline.translate('%sh ago', n);
        } else if (r < 3600 * 24 * 7) {
            const n = Math.floor(r / 3600 / 24);
            return Timeline.translate('%sd ago', n);
        } else if (r < 3600 * 24 * 30) {
            const n = Math.floor(r / 3600 / 24 / 7);
            return Timeline.translate('%sw ago', n);
        } else if (r < 3600 * 24 * 30 * 12) {
            const n = Math.floor(r / 3600 / 24 / 30);
            return Timeline.translate('%smo ago', n);
        } else {
            const n = Math.floor(r / 3600 / 24 / 365);
            return Timeline.translate('%sy ago', n)
        }
    }

    valueOf() {
        return this.diff
    }

    /**
     *
     * @param {string} layout
     * @param {struct} p
     * @return {{S: boolean, D: boolean, H: boolean, Y: boolean, I: boolean, M: boolean}}
     */
    static loadDiff(layout, p) {
        let ls = {
            'Y': false,
            'M': false,
            'D': false,
            'H': false,
            'I': false,
            'S': false,
        }
        let n = layout.length
        let start = false
        for (let i = 0; i < n; i++) {
            let c = layout[i]
            if (start) {
                if (c === '}') {
                    start = false
                }
                continue
            }
            if (c !== '{' || i > n - 3 || layout[i + 1] !== '%') {
                continue
            }
            let r = layout[i + 2]
            if (p.hasOwnProperty(r) && typeof p[r] === "number") {
                ls[r] = true
                i += 2
                start = true
            }
        }
        return ls
    }

    /**
     *
     * @param {struct} p
     * @param {struct} ls
     * @return {struct}
     */
    static carryTimeDiff(p, ls) {
        const arr = ['S', 'I', 'H', 'D', 'M', 'Y']
        let g = false
        for (let i = 0; i < arr.length; i++) {
            let a = arr[i]
            if (ls[a]) {
                if (g) {
                    p[a]++
                }
                break
            }
            if (p[a] > 0) {
                g = true
            }
        }

        if (p['S'] > 59) {
            p['S'] -= 60
            p['I']++
        }
        if (p['I'] > 59) {
            p['I'] -= 60
            p['H']++
        }
        if (p['H'] > 23) {
            p['H'] -= 24
            p['D']++
        }
        if (p['D'] > 30) {
            p['D'] -= 31
            p['M']++
        }
        if (p['M'] > 11) {
            p['M'] -= 12
            p['Y']++
        }

        return p
    }


}


/**
 * New a {time} in `YYYY-MM-DD` pattern
 * @param {vv_vk_defaultV} [args]
 * @return {time}
 */
function date(...args) {
    const v = defval(...args)
    const t = new time(v ? v : AaDateString.minDate)
    return t.setPattern('YYYY-MM-DD')
}

/**
 * New a {time} in `YYYY-MM-DD HH:II:SS` pattern
 * @param {vv_vk_defaultV} [args]
 * @return {time}
 */
function datetime(...args) {
    const v = defval(...args)
    const t = new time(v ? v : AaDateString.minDatetime)
    return t.setPattern('YYYY-MM-DD HH:II:SS')
}