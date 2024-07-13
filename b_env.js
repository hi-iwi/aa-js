class _aaEnv {
    debug = false  // {bool} 是否是debug状态
    paramName = aparam.debug
    _uri  // {typeof _aaUri}

    /**
     *
     * @param {typeof _aaUri} uri
     */
    constructor(uri) {
        this._uri = uri
        this.parseDebug()
    }

    parseDebug() {
        const url = this._uri.url()
        if (url.has(this.paramName)) {
            this.debug = url.queryBool(this.paramName)
        } else {
            const h = location.hostname.substring(0, 8)
            this.debug = ["192.168.", "localhost"].includes(h)
        }
        return this
    }

    toDebug(onDebug) {
        this.debug = bool(onDebug)
        return this
    }


    isPC() {
        return $(document).width() >= 768
    }

    isWin() {
        return /(win32|win64|windows|wince)/i.test(window.navigator.userAgent)
    }

    isIE() {
        return !!window.ActiveXObject
    }

    isWeixin() {
        return /MicroMessenger/i.test(window.navigator.userAgent)
    }

    isEdge() {
        return /Edge/i.test(window.navigator.userAgent) && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob)
    }

    isSafari() {
        let userAgent = window.navigator.userAgent
        return /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
    }

    isIphone() {
        let userAgent = window.navigator.userAgent
        return /iPhone/i.test(window.navigator.userAgent)
    }

    isIpad() {
        return /iPad/i.test(window.navigator.userAgent)
    }

    isAppleTouch() {
        return aa.env.isIphone() || aa.env.isIpad()
    }

}