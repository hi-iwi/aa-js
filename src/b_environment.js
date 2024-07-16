

class _aaEnvironment {
    name = 'aa-environment'


    constructor() {
    }

    setDebug(debug = true) {
        _aaDebugStatus_ = debug
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
         return /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
    }

    isIphone() {
         return /iPhone/i.test(window.navigator.userAgent)
    }

    isIpad() {
        return /iPad/i.test(window.navigator.userAgent)
    }

    isAppleTouch() {
        return this.isIphone() || this.isIpad()
    }

}