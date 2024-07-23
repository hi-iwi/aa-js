class AaLoggerStyle {
    name = 'aa-logger-style'

    color
    fontWeight
    background

    /**
     *
     * @param {string} color
     * @param {string}[background]
     * @param {number} [fontWeight]
     */
    constructor(color, background, fontWeight) {
        this.color = color
        this.fontWeight = fontWeight
        this.background = background;
    }

    toString() {
        let s = ''
        if (this.color) {
            s += 'color:' + this.color + ';'
        }
        if (this.background) {
            s += 'background:' + this.background + ';width:100%;'
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
    static alertEffect = s => console.log(s)
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
        log.print('[error]', ...args)
    }

    static warn(...args) {
        log.print('[warn]', ...args)
    }

    static info(...args) {
        log.print('[info]', ...args)
    }

    static debug(...args) {
        log.print('[debug]', ...args)
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
    static print(style = "", ...args) {
        const dbg = _aaDebug
        if (dbg.disabled()) {
            return
        }
        if (!(style instanceof AaLoggerStyle)) {
            args.unshift(style)
        }
        if (args.length === 0) {
            return
        }
        if (dbg.isAlert()) {
            log.alert(...args)
            return
        }

        let fn = console.log
        if (typeof args[0] === "string") {
            const match = args[0].match(/^\[([a-zA-Z]+)]/)
            if (match && typeof console[match[1]] === "function") {
                args[0] = args[0].replace(match[0], '')
                fn = console[match[1]]
            }

        }
        if (!(style instanceof AaLoggerStyle)) {
            fn(...args)
            return
        }

        let sty = style.toString()
        let s = ''
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === "object" && typeof args[i].toString !== "function" && typeof args[i].valueOf !== "function") {
                if (s) {
                    fn("%c" + s, sty)
                    s = ''
                }
                fn(args[i])
                continue
            }
            s += args[i] + ' '
        }
        if (s) {
            fn("%c" + s, sty)
        }
    }

    static breakpoint(...args) {
        log._breakpointIncr++
        // args 可能是 object
        args.unshift("%c· brk " + log._breakpointIncr + '  ', 'color:#f00;font-weight:700;')
        log.print(...args)
    }

}






