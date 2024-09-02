class AaEnv {
    name = 'aa-environment'

// JS 无法获取DPI。目前观察来看，DPR=1.25时，图片*2显示效果最好；太大的话，显示也不清晰。 1.25*1.6=2，因此取1.6倍。
    static devicePixelRatio() {
        return number(window, "devicePixelRatio", 1)
    }

    // same as $(document).height()
    static documentHeight() {
        const body = document.body
        const html = document.documentElement;
        return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    }

    static isAppleTouch() {
        return AaEnv.isIphone() || AaEnv.isIpad()
    }

    static isDebug() {
        return !_aaDebug.disabled()
    }

    static isEdge() {
        return /Edge/i.test(window.navigator.userAgent) && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob)
    }

    static isIE() {
        return !!window.ActiveXObject
    }

    static isIpad() {
        return /iPad/i.test(window.navigator.userAgent)
    }

    static isIphone() {
        return /iPhone/i.test(window.navigator.userAgent)
    }

    static isLocalhost() {
        return _aaDebug.isLocalhost()
    }

    static isPC() {
        return $(document).width() >= 768
    }

    static isSafari() {
        return /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
    }

    static isWeixin() {
        return /MicroMessenger/i.test(window.navigator.userAgent)
    }

    static isWin() {
        return /(win32|win64|windows|wince)/i.test(window.navigator.userAgent)
    }


    /**
     * Return the main area width
     *     核心区宽度
     *     // window.innerWidth /  window.innerHeight 去掉状态栏的高度、宽度
     *     // window.outerWidth / window.outerHeight 带状态栏高度
     *     // screen.width / screen.height  分辨率尺寸
     * @param {boolean} [inRatio]
     * @return {number}
     */
    static maxWidth(inRatio = false) {
        let width = Number(document.querySelector('body').offsetWidth)
        return inRatio ? width * AaEnv.devicePixelRatio() : width
    }


}