class _aaEnvironment {
    name = 'aa-environment'
    debug = false  // {bool} 是否是debug状态
    paramName = aparam.debug
    _uri  // {typeof _aaUri}


    constructor(debug = false) {
        this.debug = debug
    }

    setDebug(debug = true) {
        this.debug = debug
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