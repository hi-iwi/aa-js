class _aaDate {
    name = 'aa-date'
    static localTimezoneOffsetString = _aaDate.parseTimezoneOffsetString()
    // @type Date
    date


    pattern = 'YYYY-MM-DD HH:II:SS'
    timezoneOffset


    // check the date    -2 on unknown; -1 on zero date;  0 on OK; 1 on max date;
    // @param {string} s
    static check(s) {

        if (_aaDate.isZero(s, true)) {
            return -1
        }
        if (_aaDate.isMax(s)) {
            return 1
        }
        try {
            new _aaDate(s)
            return 0
        } catch (e) {
            return -2
        }
    }

    static isZero(s, strict = true) {
        if (!strict && !s) {
            return true
        }
        return ["0000", "0000-00", "0000-00-00", "0000-00-00 00:00:00"].includes(s)
    }

    static isMax(s) {
        return ["9999-12-31", "9999-12-31 23:59:59"].includes(s)
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
        return offset < 0 ? "+" + _aaDate.formatTime(-offset) : "-" + _aaDate.formatTime(offset)
    }

    static new(...args) {
        return new _aaDate(...args)
    }

    /*
Chrome 支持  new Date('YYYY-MM-DD')  但是 safari 不支持！！
Safari 支持的日期格式：
    YYYY-MM-DD HH:II:SS.sss+08:00
 * @param {Date|number|string} date   YYYY 'YYYY' 'YYY-MM' 'YYYY-MM-DD'  'YYYY-MM-DD HH:II:SS' 'YYYY-MM-DDTHH:II:SS' 'YYYY-MM-DD HH:II:SS.sss+08:00'
 *              timestamp 3424342234 '3424342234'              date
 * @param {string} [zone]   "+08:00"

 * 时间戳就是： AaDate.New(xxxx).valueOf() / 1000 到秒

   new _aaDate()
   new _aaDate(date:string, zone?:string)
   new _aaDate(timestamp:number, zone?string)   ---> new Date(millisecond)
   new _aaDate(year:number, month:number, day:number, hour?:number, minute?:number, second?:number, millisecond?:number, zone?:string)
 */
    constructor(...args) {
        this.timezoneOffset = _aaDate.localTimezoneOffsetString
        let l = args.length
        if (l === 0) {
            this.date = new Date()
            return
        }
        // parse zone
        if (l > 1 && args[l - 1] && typeof args[l - 1] === "string") {
            this.timezoneOffset = args[l - 1]
            l--  // 移除最后一位
        }
        let s = args[0]
        if (s instanceof Date) {
            this.date = s
            return
        }
        //  new _aaDate(year:number, month:number, day:number, hour?:number, minute?:number, second?:number, millisecond?:number, zone?:string)
        if (l > 1) {
            this.date = new Date(...args.slice(0, l))
            return
        }
        if (typeof s === "string" && /^\d+$/.test(s)) {
            s = Number(s)
        }

        if (typeof s === "number") {
            console.log('%c' + "[warn] new _aaDate(timestamp * second)  ==> different with new Date(millisecond)", 'color:#aa0;font-weight:700;')
            this.date = new Date(datex * C.Second)
            return
        }

        if (typeof s !== "string") {
            throw new TypeError("invalid date")
        }

        // "0000-00-00 00:00:00" 是invalid date
        // "9999-12-31 23:59:59" 是可以的
        // if (["0000", "0000-00", "0000-00-00", "0000-00-00 00:00:00"].includes(s)) {
        //
        // }
        //
        // if (["9999-12-31", "9999-12-31 23:59:59"].includes(d)) {
        //
        // }

        if (/^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}\d{2}$/.test(s)) {
            s += '.000' + this.timezoneOffset
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            s += 'T00:00:00.000' + this.timezoneOffset
        } else if (/^\d{4}-\d{2}$/.test(s)) {
            s += '-01T00:00:00.000' + this.timezoneOffset
        } else if (/^\d{4}$/.test(s)) {
            s += '-01-01T00:00:00.000' + this.timezoneOffset
        }
        this.date = new Date(s.replace(' ', 'T'))
    }


    setPattern(pattern) {
        this.pattern = pattern
        return this
    }

    // 只保留特殊常用的函数，其他的如果需要用。就调用 xxx.date.xxxx 直接调用即可
    toString() {
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

    // Gets the year
    year() {
        return this.date.getFullYear()
    }

    // Gets the real month, starts from 1
    month() {
        return this.date.getMonth() + 1    // Date.getMonth 从0 开始
    }

    // Gets the day-of-the-month
    day() {
        return this.date.getDate()
    }

    // Gets the day of the week
    weekDay() {
        return this.date.getDay()
    }

    hour() {
        return this.date.getHours()
    }

    minute() {
        return this.date.getMinutes()
    }

    second() {
        return this.date.getSeconds()
    }

    millisecond() {
        return this.date.getMilliseconds()
    }

    // timestamp in milliseconds.   +date  可以隐式调用 valueOf()
    valueOf() {
        return this.date.valueOf()
    }

    // 等同于 valueOf()
    // @deprecated
    // getTime() {
    //     return this.date.getTime()
    // }
    //


    timestamp() {
        return Math.floor(this.valueOf() / C.Second)
    }


    // Gets quarter of the year
    quarter() {
        return Math.floor((this.date.getMonth() + 3) / 3)
    }

    // YYYY-MM-DD HH:II:SS   YYYY-MM-DD HH:II:SS.sss
    // z ==> timezone
    format(s = "YYYY-MM-DD HH:II:SS") {
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
     */
    diff(d1) {
        return new _aaDateDifference(this.date, d1)
    }

    // 用于json序列号
    toJSON() {
        return this.toString()
    }
}


class _aaDateDifference {
    // differences in milliseconds
    diff

    yearsPart
    monthsPart
    daysPart
    hoursPart
    minutesPart
    secondsPart
    millisecondsPart


    constructor(d0, d1) {
        d1 = new _aaDate(d1)

        this.diff = d1 - d0

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

    format(layout, noCarry = false) {
        // "{%Y年}{%M个月}{%D天}
        if (this.diff < C.Second) {
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

}