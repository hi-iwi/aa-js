
// static class
class _aaEnvironment {
    name = 'aa-environment'


    constructor() {
    }

    static setDebug(debug = true) {
        _aaDebugStatus_ = debug
    }

    static isPC() {
        return $(document).width() >= 768
    }

    static isWin() {
        return /(win32|win64|windows|wince)/i.test(window.navigator.userAgent)
    }

    static isIE() {
        return !!window.ActiveXObject
    }

    static  isWeixin() {
        return /MicroMessenger/i.test(window.navigator.userAgent)
    }

    static isEdge() {
        return /Edge/i.test(window.navigator.userAgent) && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob)
    }

    static isSafari() {
         return /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
    }

    static  isIphone() {
         return /iPhone/i.test(window.navigator.userAgent)
    }

    static isIpad() {
        return /iPad/i.test(window.navigator.userAgent)
    }

    static isAppleTouch() {
        return _aaEnvironment.isIphone() || _aaEnvironment.isIpad()
    }

}