let __aaBreakPointIncr = 0

// 深度复制，应该使用  object2 = {...object}
function log(...args) {
    if (aa.env.debug) {
        if (aa.url().queryBool('_alert')) {
            let s = ''
            for (let i = 0; i < args.length; i++) {
                s += args[i] + ' '
            }
            AaEffect.Alert(s)
        }
        console.log(...args)
    }
}

function logc(msg, rgb, strong = false) {
    let style = ''
    if (atype.notEmpty(rgb)) {
        style += 'color:' + rgb + ';'
    }
    if (strong) {
        style += 'font-weight:700;'
    }
    if (typeof msg === "object") {
        log("%c[error]", style)
        log(msg)
        return
    }
    log("%c" + msg, style)  // 颜色
}

// 跟踪 event 执行事件
// warn 用  console.warn
function loge(event) {
    logc(event, '#ff3ca2', true)
}

function debug(...args) {
    // 只能开始字符串加样式，后面的不能再加了
    let msg = "%c[debug]%c"
    let styles = ['color:#eee;', 'color:#bbb;']
    let onlyStr = true
    let p = []
    for (let i = 0; i < args.length; i++) {
        let m = args[i]
        if (typeof m === "string") {
            if (onlyStr) {
                msg += ' ' + m
            }
        } else {
            onlyStr = false
            p.push(m)
        }
    }
    log(msg, ...styles, ...p)
}

function breakpoint(...args) {
    __aaBreakPointIncr++
    // args 可能是 object
    args.unshift("%c· brk " + __aaBreakPointIncr + '  ', 'color:#f00;font-weight:700;')
    log(...args)
}