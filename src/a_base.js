const _debugQueryName_ = '_debug'   // 0 o debug; 1/true debug via console; 2/alert debug via alert
const _apolloQueryName_ = 'apollo'

var _aaDebugStatus_ = void false  // 为了方便 log 类，debug状态一律用全局

function _aaIsDebug() {
    if (typeof _aaDebugStatus_ === "boolean") {
        return _aaDebugStatus_
    }
    let debug = new RegExp(_debugQueryName_ + "=(1|true|2|alert)", 'i').test(window.location.search)
    if (debug) {
        _aaDebugStatus_ = debug
        return _aaDebugStatus_
    }
    const h = window.location.hostname.substring(0, 8)
    _aaDebugStatus_ = ["192.168.", "localhost"].includes(h)
    return _aaDebugStatus_
}