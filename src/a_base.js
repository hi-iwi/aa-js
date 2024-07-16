const _debugQueryName_ = '_debug'
const _alertQueryName_ = '_alert'
const _apolloQueryName_ = 'apollo'

var _aaDebugStatus_ = void false  // 为了方便 log 类，debug状态一律用全局

function _aaIsDebug() {
    if (typeof _aaDebugStatus_ === "boolean") {
        return _aaDebugStatus_
    }
    let matches = window.location.search.match(new RegExp(_debugQueryName_ + "=(\\w+)"))
    if (matches && matches[1]) {
        _aaDebugStatus_ = bool(matches[1])
        return _aaDebugStatus_
    }
    const h = window.location.hostname.substring(0, 8)
    return ["192.168.", "localhost"].includes(h)
}