/**
 * @import C.MaxMainWidth
 */
class _aaEnvironment {
    name = 'aa-environment'


    constructor() {
    }

    static setDebug(debug = true) {
        _aaDebugStatus_ = debug
    }

    /**
     * Return the main area width
     *     核心区宽度
     *     // window.innerWidth /  window.innerHeight 去掉状态栏的高度、宽度
     *     // window.outerWidth / window.outerHeight 带状态栏高度
     *     // screen.width / screen.height  分辨率尺寸
     */
    static maxWidth() {
      return  document.querySelector('body').offsetWidth
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

    static isWeixin() {
        return /MicroMessenger/i.test(window.navigator.userAgent)
    }

    static isEdge() {
        return /Edge/i.test(window.navigator.userAgent) && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob)
    }

    static isSafari() {
        return /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
    }

    static isIphone() {
        return /iPhone/i.test(window.navigator.userAgent)
    }

    static isIpad() {
        return /iPad/i.test(window.navigator.userAgent)
    }

    static isAppleTouch() {
        return _aaEnvironment.isIphone() || _aaEnvironment.isIpad()
    }

}