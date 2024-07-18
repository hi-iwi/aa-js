/**
 * @import C.MinDatetime, C.MaxDatetime
 */
class _aaDateString {
    name = 'aa-date-string'
    timezoneOffset
    #value = ""
    raw = ""

    static #yearLen = 4 // len('0000')
    static #dateLen = 10  // len('0000-00-00')
    static #datetimeLen = 19   // len('0000-00-00 00:00:00')
    static #yearPattern = /^\d{4}$/
    static #datePattern = /^\d{4}-[01]\d-[03]\d$/
    static #datetimePattern = /^\d{4}-[01]\d-[03]\d[\sT][0-2]\d:[0-5]\d:[0-5]\d$/
    static #minYear = C.MinDatetime.substring(0, 4) || '0000'
    static #maxYear = C.MaxDatetime.substring(0, 4) || '9999'
    static #minDate = C.MinDatetime.substring(0, 10) || '0000-00-00'
    static #maxDate = C.MaxDatetime.substring(0, 10) || '9999-12-31'
    static #minDatetime = C.MinDatetime || '0000-00-00 00:00:00'
    static #maxDatetime = C.MaxDatetime || '9999-12-31 23:59:59'

    get value() {
        return this.#value
    }

    set value(value) {
        this.load(value)
    }

    static localTimezoneOffsetString = _aaDateString.parseTimezoneOffsetString()

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
        return offset < 0 ? "+" + _aaDateString.formatTime(-offset) : "-" + _aaDateString.formatTime(offset)
    }

    /**
     *
     * @param {string} s  {YYYY|YYYY-MM-DD|YYYY-MM-DD HH:II:SS}
     * @param {string} [zone]
     */
    constructor(s, zone = _aaDateString.localTimezoneOffsetString) {
        this.load(s, zone)
    }

    /**
     *
     * @param {string} s
     * @param {string} [zone]
     */
    load(s, zone) {
        this.raw = s
        s = s.replace(' ', 'T')
        let reg = /[-+][01]\d:[0-5]\d$/
        let zm = s.match(reg)
        if (zm) {
            zone = zm[0]
            s = s.replace(reg, '')
        }
        if (!zone) {
            zone = _aaDateString.localTimezoneOffsetString
        }

        if (_aaDateString.#datetimePattern.test(s)) {
            s += '.000' + zone
        } else if (_aaDateString.#datePattern.test(s)) {
            s += 'T00:00:00.000' + zone
        } else if (_aaDateString.#yearPattern.test(s)) {
            s += '-01-01T00:00:00.000' + zone
        } else if (!["", "null", "invalid date", "invalid time value"].includes(s.toLowerCase())) {
            s += zone
        }
        this.timezoneOffset = zone
        this.#value = s
    }

    isYear() {
        return _aaDateString.#yearPattern.test(this.raw)
    }

    isDate() {
        return _aaDateString.#datePattern.test(this.raw)
    }

    isDatetime() {
        return _aaDateString.#datetimePattern.test(this.raw)
    }

    isZero() {
        return this.#value.indexOf("0000-00-00T00:00:00.000") === 0
    }

    isMin(includeZero = true) {
        const d = _aaDateString
        const v = this.#value
        if (includeZero && this.isZero()) {
            return true
        }
        if (this.isYear()) {
            return v.substring(0, d.#yearLen) === d.#minYear
        }
        if (this.isDate()) {
            return v.substring(0, d.#dateLen) === d.#minDate
        }
        return v.substring(0, d.#datetimeLen) === d.#minDatetime
    }

    isMax() {
        const d = _aaDateString
        const v = this.#value
        if (this.isYear()) {
            return v.substring(0, d.#yearLen) === d.#maxYear
        }
        if (this.isDate()) {
            return v.substring(0, d.#dateLen) === d.#maxDate
        }
        return v.substring(0, d.#datetimeLen) === d.#maxDatetime
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

    toString() {
        return this.#value
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
        return this.isZero() ? new _aaDateZero(this.#toZero()) : new Date(this.#value)
    }

    valueOf() {
        return this.date().valueOf()
    }

}

class _aaDateValidator {
    name = 'aa-date-validator'

    #type


    // 253402271999000 = new Date("9999-12-31 23:59:59")
    // 253402214400000 = new Date("9999-12-31")


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


    static #minYearTs = new _aaDateString(C.MinDatetime.substring(0, 4) || '0000').valueOf()
    static #maxYearTs = new _aaDateString(C.MaxDatetime.substring(0, 4) || '9999').valueOf()
    static #minDateTs = new _aaDateString(C.MinDatetime.substring(0, 10) || '0000-00-00').valueOf()
    static #maxDateTs = new _aaDateString(C.MaxDatetime.substring(0, 10) || '9999-12-31').valueOf()
    static #minDatetimeTs = new _aaDateString(C.MinDatetime || '0000-00-00 00:00:00').valueOf()
    static #maxDatetimeTs = new _aaDateString(C.MaxDatetime || '9999-12-31 23:59:59').valueOf()


    constructor(s, strict = true) {
        this.load(s, strict)
    }

    /**
     *
     * @param {_aaDateString|string|number|Date} date
     * @param {boolean} strict
     * @return {_aaDateValidator}
     */
    load(date, strict = true) {
        const d = _aaDateValidator
        date = typeof date === "string" ? new _aaDateString(date) : date
        if (date instanceof _aaDateString) {
            if (date.isZero()) {
                this.#type = date.isYear() ? d.ZeroYear : (date.isDate() ? d.ZeroDate : d.ZeroDatetime)
                return this
            }
            if (date.isMin(strict)) {
                this.#type = date.isYear() ? d.MinYear : (date.isDate() ? d.MinDate : d.MinDatetime)
                return this
            }
            if (date.isMax()) {
                this.#type = date.isYear() ? d.MaxYear : (date.isDate() ? d.MaxDate : d.MaxDatetime)
                return this
            }
            date = date.toString()
        }


        // new Date() not yet thrown an exception.  but .toString() may throw
        try {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Invalid_date
            // RangeError: Invalid time value (V8-based)
            // RangeError: invalid date (Firefox)
            // RangeError: Invalid Date (Safari)

            const v = date instanceof Date ? date.valueOf() : new Date(date).valueOf()
            if (isNaN(v)) {
                this.#type = d.InvalidDate
                return this
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
            this.#type = _aaDateValidator.InvalidDate
        }
        return this
    }

    setInvalid() {
        this.#type = _aaDateValidator.InvalidDate
    }


    isZero() {
        const d = _aaDateValidator
        return [d.ZeroYear, d.ZeroDate, d.ZeroDatetime].includes(this.#type)
    }

    isMin(includeZero = true) {
        const d = _aaDateValidator
        return [d.MinYear, d.MinDate, d.MinDatetime].includes(this.#type) || (includeZero && this.isZero())
    }

    isMax() {
        const d = _aaDateValidator
        return [d.MaxYear, d.MaxDate, d.MaxDatetime].includes(this.#type)
    }

    isValid(includeMax = false) {
        const d = _aaDateValidator
        return this.#type === d.ValidDate || (includeMax && this.isMax())
    }

    notValid(includeMax = false) {
        return !this.isValid(includeMax)
    }

}

class _aaDateZero extends Date {
    name = 'aa-date-zero'
    value

    // @param {string} date
    constructor(date = '0000-00-00 00:00:00') {
        super(date)
        this.value = date
    }

    toString() {
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

    getTime() {
        return 0
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

    toJSON() {
        return this.value
    }
}

class _aaDate {
    name = 'aa-date'
    // @type Date
    #date
    // @type AaDateValidator
    #validator = new _aaDateValidator("Invalid Date")

    pattern = 'YYYY-MM-DD HH:II:SS'
    timezoneOffset = _aaDateString.localTimezoneOffsetString


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
     * Extract the date string to YYYYMM style number
     * @param {string} date
     * @return number
     */
    static toYearMonthNumber(date) {
        let ds = new _aaDateString(date)
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
     *

     * @param args
     *  date string:
     *      YYYY-MM-DDTHH:II:SS.sss+08:00       YYYY-MM-DD HH:II:SS.sss+08:00
     *      YYYY-MM-DDTHH:II:SS                 YYYY-MM-DD HH:II:SS
     *      YYYY-MM-DD        YYYY-MM            YYYY
     * @warn Chrome 支持  new Date('YYYY-MM-DD')  但是 safari 不支持！！Safari 需转换完整字符串：YYYY-MM-DD HH:II:SS.sss+08:00
     * @usage
     *  new _aaDate()
     *  new _aaDate(date:string, zone?:string)
     *  new _aaDate(timestamp:number, zone?string)   ---> new Date(millisecond)
     *  new _aaDate(year:number, month:number, day:number, hour?:number, minute?:number, second?:number, millisecond?:number, zone?:string)
     *  @throws {TypeError}
     */
    constructor(...args) {
        let l = args.length
        if (l === 0) {
            this.load(new Date())
            return
        }
        if (args[0] instanceof _aaDate) {
            return args[0]
        }
        if (typeof args[0] === "undefined" || args[0] === null) {
            args[0] = new Date()
        }

        // parse zone
        if (l > 1 && args[l - 1] && typeof args[l - 1] === "string") {
            this.timezoneOffset = args[l - 1]
            l--  // 移除最后一位
        }
        //  new _aaDate(year:number, month:number, day:number, hour?:number, minute?:number, second?:number, millisecond?:number, zone?:string)
        let arg = l === 1 ? args[0] : new Date(...args.slice(0, l))
        this.load(arg)
    }

    // @param {Date|string|number} date
    load(date, strict = true) {
        this.resetPatter()
        let zone = this.timezoneOffset
        // timestamp
        if (typeof date === "number") {
            date = new Date(date)
        } else if (typeof date === "string") {
            this.setPattern(date)
            let ds = new _aaDateString(date, this.timezoneOffset)
            this.validator.load(ds, strict)
            if (this.validator.isMin() || this.validator.isMax()) {
                return this
            }
            date = new Date(ds.toString())
        }

        if (date instanceof Date) {
            this.#date = date
            this.validator.load(date, strict)
            if (this.validator.isValid(true)) {
                this.timezoneOffset = zone  // set after valid date
            }
            return this
        } else {
            date = new Date("Invalid Date")
            this.#date = date
            this.validator.setInvalid()
        }
        return this
    }

    resetPatter() {
        this.pattern = 'YYYY-MM-DD HH:II:SS'
    }

    /**
     *
     * @param pattern   YYYY-MM-DD HH:II:SS.sssZ  or  2024-07-15 00:00:00.000+08:00
     * @return {_aaDate}
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

    // 只保留特殊常用的函数，其他的如果需要用。就调用 xxx.date.xxxx 直接调用即可
    // @return {string}
    toString(invalidString = void '') {
        if (typeof invalidString !== "undefined" && !this.validator.isValid()) {
            return invalidString
        }
        return this.format(this.pattern)
    }


    // How many days in this month
    monthDays() {
        // new Date(2016, 2,1)  ===   2016-03-01 00:00:00  月份是从0开始
        // new Date(2016,2,0)  ===  2016-02-29 00:00:00    --> 3月1日前一天
        return new Date(this.year(), this.month(), 0).getDate()
    }

    datetime() {
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
    // getTime() {
    //     return this.#date.getTime()
    // }
    //


    timestamp() {
        return Math.floor(this.valueOf() / C.Second)
    }


    // Get quarter-of-the-year
    quarter() {
        return Math.floor((this.#date.getMonth() + 3) / 3)
    }

    // Get week-of-the-year
    weekOfYear() {
        let d1 = new Date(this.year(), 0, 1) // 当年1月1日
        let x = Math.round((this - d1) / C.Day);
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
     */
    setSeconds(sec, ms) {
        return this.#date.setSeconds(sec, ms)
    }

    /**
     * set the minutes of the Date object using local time.
     * @param {number} min
     * @param {number} [sec]
     * @param {number} [ms]
     * @return {number}
     */
    setMinutes(min, sec, ms) {
        return this.#date.setMinutes(min, sec, ms)
    }

    /**
     *
     * @param {number} hours
     * @param {number} [min]
     * @param {number} [sec]
     * @param {number} [ms]
     * @returnn {number}
     */
    setHours(hours, min, sec, ms) {
        return this.#date.setHours(hours, min, sec, ms)
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
     */
    setMonth(month, day) {
        return this.#date.setMonth(month, day)
    }

    /**
     * Set the year of the Date object using local time.
     * @param year
     * @param {number} [month]
     * @param {number} [day]
     * @return {number}
     */
    setFullYear(year, month, day) {
        return this.#date.setFullYear(year, month, day)
    }

    // YYYY-MM-DD HH:II:SS   YYYY-MM-DD HH:II:SS.sss
    // z ==> timezone
    format(s = "YYYY-MM-DD HH:II:SS") {
        if (this.#date instanceof _aaDateZero) {
            return s.replace(/[YMDHISs]/g, '0').replace(/Z/g, this.timezoneOffset)
        }

        // @type {[{key:string}:[padZero:number, *]}
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
        };

        for (let [k, u] of Object.entries(o)) {
            const padZero = u[0]
            const v = String(u[1])
            if (k === "Z") {
                s = s.replace(/Z/g, v)  // 整体
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
     * @param {_aaDate|Date|string|number} [d1]  default to now, a.k.a. new Date()
     */
    diff(d1) {
        return new _aaDateDifference(this, d1)
    }

    // 用于json序列号
    toJSON() {
        return this.toString()
    }
}


class _aaDateDifference {
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


    constructor(d0, d1) {
        d0 = d0 instanceof _aaDate ? d0 : new _aaDate(d0)
        d1 = d1 instanceof _aaDate ? d1 : new _aaDate(d1)  // new _aaDate(undfined) equals to new _aaDate(new Date())
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
        return round(this.diff / C.Day)
    }

    /**
     * Calculate the difference between these two date in hours
     * @param {(((x:number)=>number)|Math.floor|Math.round|Math.ceil|RoundTrim|RoundReverse|RoundAway)} round
     * @return number
     */
    inHours(round = Math.round) {
        return round(this.diff / C.Hour)
    }

    /**
     * Calculate the difference between these two date in minutes
     * @param {(((x:number)=>number)|Math.floor|Math.round|Math.ceil|RoundTrim|RoundReverse|RoundAway)} round
     * @return number
     */
    inMinutes(round = Math.round) {
        return round(this.diff / C.Minute)
    }

    /**
     * Calculate the difference between these two date in seconds
     * @param {(((x:number)=>number)|Math.floor|Math.round|Math.ceil|RoundTrim|RoundReverse|RoundAway)} round
     * @return number
     */
    inSeconds(round = Math.round) {
        return round(this.diff / C.Second)
    }

    inMilliseconds() {
        return this.diff
    }

    valueOf() {
        return this.diff
    }

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

    /**
     * Format date with specified formats
     * @param layout
     * @param noCarry
     * @return {string}
     */
    format(layout, noCarry = false) {
        // "{%Y年}{%M个月}{%D天}
        if (!this.valid || this.diff < C.Second) {
            return ""
        }
        layout = string(layout)
        let p = {
            'Y': this.yearsPart,
            'M': this.monthsPart,
            'D': this.daysPart,
            'H': this.hoursPart,
            'I': this.minutesPart,
            'S': this.secondsPart
        }
        let ls = _aaDateDifference.loadDiff(layout, p)
        if (!noCarry) {
            p = _aaDateDifference.carryTimeDiff(p, ls)
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
     * @param {string|{[key:string]:string}} dict
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

}