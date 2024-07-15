class AaLoggerStyle {
    name = 'aa-logger-style'
    color
    fontWeight

    /**
     *
     * @param {string} color
     * @param fontWeight
     */
    constructor(color, fontWeight = 400) {
        this.color = color
        this.fontWeight = fontWeight
    }

    toString() {
        let s = ''
        if (this.color) {
            s += 'color:' + this.color + ';'
        }

        if (this.fontWeight && this.fontWeight !== 400) {
            s += 'font-weight:' + this.fontWeight + ';'
        }
        return s
    }
}

class log {
    name = 'aa-log'

      // @type {(s:string)=>void}
    static alertEffect= s => console.log(s)
    static _breakpointIncr = 0




    /**
     *
     * @param {(s:string)=>void} effect
     */
    static setAlertEffect(effect) {
        log.alertEffect = effect
    }

    static alert(...args) {
        let s = ''
        for (let i = 0; i < args.length; i++) {
            s += args[i] + ' '
        }
        log.alertEffect(s)
    }

    static error(...args) {
        log.print(new AaLoggerStyle("#f00", 700), '[error]', ...args)
    }

    static warn(...args) {
        log.print(new AaLoggerStyle("#d5cc00", 700), '[warn]', ...args)
    }

    static info(...args) {
        log.print(new AaLoggerStyle("#6ece00"), '[info]', ...args)
    }

    static debug(...args) {
        log.print(new AaLoggerStyle("#888"), '[debug]', ...args)
    }

    // console.log with color

    static draw(rgb, ...args) {
        log.print(new AaLoggerStyle(rgb), ...args)
    }

    static strong(...args) {
        log.print(new AaLoggerStyle('#000', 700), ...args)
    }


    /**
     *
     * @param {AaLoggerStyle|*} style
     * @param args
     */
    static print(style, ...args) {
        if (!_aaIsDebug()) {
            return
        }

        let data = style instanceof AaLoggerStyle ? args : {style, ...args}
        let matches = window.location.search.match(new RegExp(aparam.alert + "=(\\w+)"))
        let alert = bool(matches, 1)
        if (alert) {
            log.alert(...data)
            return
        }

        if (!(style instanceof AaLoggerStyle)) {
            console.log(...data)
            return
        }

        let sty = style.toString()
        let s = ''
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === "object" && typeof args[i].toString !== "function" && typeof args[i].valueOf !== "function") {
                if (s) {
                    console.log("%c" + s, sty)
                    s = ''
                }
                console.log(args[i])
                continue
            }
            s += args[i] + ' '
        }
        if (s) {
            console.log("%c" + s, sty)
        }
    }

    static breakpoint(...args) {
        log._breakpointIncr++
        // args 可能是 object
        args.unshift("%c· brk " + log._breakpointIncr + '  ', 'color:#f00;font-weight:700;')
        log.print(...args)
    }

}






