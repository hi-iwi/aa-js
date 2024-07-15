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

class _aaLogger {
    name = 'aa-logger'
    // @type {_aaUri}
    _uri
    // @type {_aaEnvironment}
    _env
    // @type {(s:string)=>void}
    alertEffect
    _breakpointIncr = 0

    static new(...args) {
        return new _aaApollo(...args)
    }

    /**
     * @param {_aaURI} [uri]
     * @param {_aaEnvironment} [env]
     */
    constructor(uri, env) {
        this._uri = uri
        this._env = env
        this.alertEffect = s => console.log(s)
    }

    #isDebug() {
        return this._env ? this._env.debug : false
    }

    /**
     *
     * @param {(s:string)=>void} effect
     */
    setAlertEffect(effect) {

        this.alertEffect = effect
    }

    alert(...args) {
        let s = ''
        for (let i = 0; i < args.length; i++) {
            s += args[i] + ' '
        }
        this.alertEffect(s)
    }

    error(...args) {
        this.print(new AaLoggerStyle("#f00", 700), '[error]', ...args)
    }

    warn(...args) {
        this.print(new AaLoggerStyle("#d5cc00", 700), '[warn]', ...args)
    }

    info(...args) {
        this.print(new AaLoggerStyle("#6ece00"), '[info]', ...args)
    }

    debug(...args) {
        this.print(new AaLoggerStyle("#888"), '[debug]', ...args)
    }

    // console.log with color

    draw(rgb, ...args) {
        this.print(new AaLoggerStyle(rgb), ...args)
    }

    strong(...args) {
        this.print(new AaLoggerStyle('#000', 700), ...args)
    }


    /**
     *
     * @param {AaLoggerStyle|*} style
     * @param args
     */
    print(style, ...args) {
        if (!this.#isDebug()) {
            return
        }

        let data = style instanceof AaLoggerStyle ? args : {style, ...args}
        let alert = this._uri.new().queryBool(aparam.alert)
        if (alert) {
            this.alert(...data)
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

    breakpoint(...args) {
        this._breakpointIncr++
        // args 可能是 object
        args.unshift("%c· brk " + this._breakpointIncr + '  ', 'color:#f00;font-weight:700;')
        this.print(...args)
    }

}






