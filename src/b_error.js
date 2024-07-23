// @import atype

// @type {(null|{[key:number]:string})}
let _aerrorCode2MsgMap_ = null

// @type  {{[key:string]:(null|{[key:string]:string})}}
let _aerrorDictionaries_ = {
    'en'   : null,  // will init later   必须要增加一个en模式的，这样直接匹配到可以直接输出
    'zh-CN': {
        "Please input: %s"     : "请输入：%s",
        "Bad parameter: %s"    : "% 输入错误",
        "Invalid parameter: %s": "%s 输入不符合规则",


        "Ok"        : "成功",
        "No content": "成功",

        "Bad request"     : "请求参数或其他错误",
        "Unauthorized"    : "请登录授权后使用",
        "Payment required": "请付费后使用",
        "Forbidden"       : "您没有权限使用",
        "Not found"       : "糟糕，数据找不到啦~",

        "Timeout"               : "请求超时，请稍后再试",
        "Conflict"              : "异常冲突",
        "Gone"                  : "数据已被删除",
        "Unsupported media type": "文件格式不正确",

        "No rows"          : "没有数据啦",
        "Locked"           : "资源已被锁定",
        "Failed dependency": "之前发生错误",
        "Retry with"       : "正在重试",
        "Illegal"          : "因法律原因不可用",

        "Internal server error"   : "服务端错误",
        "Not implemented"         : "拒绝服务",
        "Bad gateway"             : "上游服务异常",
        "Server exception"        : "服务端异常",
        "Gateway timeout"         : "上游服务器超时",
        "Bandwidth limit exceeded": "访问太频繁，临时限制访问",
        "Server status exception" : "服务器状态异常",
        "Client throw"            : "客户端抛出异常",
    }
};
const AErrorEnum = {
    OK       : 200,
    NoContent: 204,

    BadRequest     : 400,
    Unauthorized   : 401,
    PaymentRequired: 402,
    Forbidden      : 403,
    NotFound       : 404,// refer to redis.Nil, sql.ErrNoRows

    Timeout             : 408, // 被限流也是返回这个
    Conflict            : 409,
    Gone                : 410,              // 以前存在过，以后都不会再存在了，表示数据已经删除、过期、失效
    UnsupportedMediaType: 415, // 上传的数据格式非法
    // code:444, data:null   表示空数组返回这个错误，表示不可以再进行下一页查询了
    // code:200/204, data:[]  空数组，表示查询到了数据，但是数据过滤完了，可以尝试下一页查询
    NoRows          : 444,
    Locked          : 423,
    FailedDependency: 424,// 之前发生错误
    TooEarly        : 425, // 表示服务器不愿意冒险处理可能被重播的请求。
    TooManyRequests:429, // 用户在给定的时间内发送了太多请求（"限制请求速率"）
    RetryWith       : 449,  // 特殊错误码，msg 用于跳转
    Illegal         : 451,// 该请求因政策法律原因不可用。

    InternalServerError   : 500,
    NotImplemented        : 501, // 服务器不支持当前请求所需要的某个功能。当服务器无法识别请求的方法，
    BadGateway            : 502,  //
    ServerException       : 503,  // 客户端自定义，表示未知服务端错误；最常见的就是，没有正确返回数据，或者返回 {code:0,msg:""} 等未协商的数据，导致客户端无法正常处理
    GatewayTimeout        : 504,
    BandwidthLimitExceeded: 509,
    ServerStatusException : 555,  // http 状态码出错，未达到程序阶段
    ClientThrow           : 556, // 捕获js catch的报错


    /**
     *
     * @return {{[key:number]:string}}
     */
    getCode2MsgMap: function () {
        if (_aerrorCode2MsgMap_) {
            return _aerrorCode2MsgMap_
        }
        _aerrorCode2MsgMap_ = {}
        for (const [key, value] of Object.entries(AErrorEnum)) {
            // starts with BigCase
            if (typeof key !== "string" || !/^[A-Z][a-zA-Z]*$/.test(key)) {
                continue
            }
            let k = fmt.toSentenceCase(key, true)
            _aerrorCode2MsgMap_[value] = k
        }
        return _aerrorCode2MsgMap_
    },
    /**
     *
     * @param {number} code
     * @param  {string|{[key:string]:string}} [dict]
     * @return {string}
     */
    code2Msg: function (code, dict = 'zh-CN') {
        code = number(code)
        let m = AErrorEnum.getCode2MsgMap()
        let s = m[code] ? m[code] : "Status exception"
        dict = AErrorEnum.getDictionary(dict)
        return dict[s] ? dict[s] : s
    },
    /**
     *
     * @return  {{[key:string]:(null|{[key:string]:string})}}
     */
    getDictionaries: function () {
        if (_aerrorDictionaries_['en']) {
            return _aerrorDictionaries_
        }
        _aerrorDictionaries_['en'] = {}
        for (const [key, value] of Object.entries(AErrorEnum)) {
            // starts with BigCase
            if (typeof key !== "string" || !/^[A-Z][a-zA-Z]*$/.test(key)) {
                continue
            }
            let k = fmt.toSentenceCase(key, true)
            _aerrorDictionaries_['en'][k] = k  // 'Bad gateway': 'Bad gateway'  就是 k:k方式，不同于上面 code2msg map
        }
        return _aerrorDictionaries_
    },
    /**
     *
     * @param  {string|{[key:string]:string}} [dict]
     * @return {{[key:string]:string}}
     */
    getDictionary: function (dict = 'zh-CN') {
        let dictionary = AErrorEnum.getDictionaries()
        if (len(dict) === 0 || typeof dict === "string") {
            dict = dict && len(_aerrorDictionaries_[dict]) > 0 ? _aerrorDictionaries_[dict] : _aerrorDictionaries_['en']
        } else {
            dict = {...dictionary['en'], ...dict}
        }
        return dict
    },
    /**
     *
     * @param {number} code
     * @param {string} [msg]
     * @param  {string|{[key:string]:string}} [dict]
     * @return {string}
     */
    translate: function (code, msg, dict = 'zh-CN') {
        dict = AErrorEnum.getDictionary(dict)
        if (dict[msg]) {
            return dict[msg]
        }
        let arr = msg.matchAll(/param[^`]*`([^`]+)`.*is\s+required/ig)
        for (const a of arr) {
            let p = dict[a[1]] ? dict[a[1]] : a[1]
            return fmt.translate(dict, "Please input: %s", p)
        }
        arr = msg.matchAll(/bad\s+param[^`]*`([^`]+)`/ig)
        for (const a of arr) {
            let p = dict[a[1]] ? dict[a[1]] : a[1]
            return fmt.translate(dict, "Bad parameter: %s", p)
        }
        arr = msg.matchAll(/param[^`]*`([^`]+)`.*not\s+match/ig)
        for (const a of arr) {
            let p = dict[a[1]] ? dict[a[1]] : a[1]
            return fmt.translate(dict, "Invalid parameter: %s", p)
        }

        return msg ? msg : AErrorEnum.code2Msg(code, dict)
    }

}


/**
 * @warn ts 下就不要继承 Error，因为ts把 Error.prototype设为私有，外面是无法访问的
 */
class AError extends Error {
    name = "AError"
    code
    message // 原始数据。部分错误会把msg当作有效信息。比如 449 RetryWith 会通过该数据传递跳转URL等

    #dict = {}
    #heading = ''
    #ending = ''

    get code() {
        return this.code
    }

    get msg() {
        return this.getMsg()
    }

    set msg(value) {
        this.message = value
    }

    static newBadRequest(param, dict) {
        return new AError(AErrorEnum.BadRequest, "Bad request `" + param + "`", dict)

    }

    static parseResp(resp, dict) {
        if (!resp) {
            return new AError(AErrorEnum.ServerException, "", dict)
        }
        if (typeof resp === "string") {
            try {
                resp = JSON.parse(resp.trim())
            } catch (e) {
                return new AError(AErrorEnum.ServerException, "", dict)
            }
        }
        if (resp && typeof resp === "object" && resp.hasOwnProperty("code") && resp.hasOwnProperty("msg")) {
            return new AError(resp['code'], resp['msg'], dict)
        }

        return new AError(AErrorEnum.ServerException, "", dict)
    }


    /**
     *
     * @param code
     * @param {string|{[key:string]:string}} [msg]
     * @param {{[key:string]:string}} [dict] 创建的时候更接近业务，而输出的时候往往由框架或底层完成。因此字典创建时期提供更合理
     * @example
     *  new AError(code)
     *  new AError(code, dict)        new AError(400, {})
     */
    constructor(code, msg, dict) {
        if (!dict && typeof msg === "object") {
            dict = msg
            msg = ''
        }
        super(msg)
        this.code = code
        this.message = msg
        this.#dict = dict
    }


    toString() {
        return this.getMsg() + " [code:" + this.code + "]"
    }

    getMsg(dict = 'zh-CN') {
        if (len(this.#dict) > 0) {
            if (!dict || typeof dict === "string") {
                dict = this.#dict
            } else {
                dict = {...this.#dict, ...dict}
            }
        }

        dict = AErrorEnum.getDictionary(dict)
        let heading = fmt.translate(dict, this.#heading)
        let msg = AErrorEnum.translate(this.code, this.message)
        let ending = fmt.translate(dict, this.#ending)
        if (heading) {
            heading += ' '
        }
        if (ending) {
            ending = ' ' + ending
        }
        return heading + ' ' + msg + ' ' + ending
    }

    /**
     * Append message to error message
     * @param {string} heading
     * @return {AError}
     */
    addHeading(heading) {
        this.#heading += ' ' + heading
        return this
    }

    is(code) {
        return code === this.code
    }

    isOK() {
        return this.code >= 200 && this.code < 300
    }

    isServerErrors() {
        return this.code >= 500
    }

    isNoContent() {
        return this.is(AErrorEnum.NoContent)
    }

    isBadRequest() {
        return this.is(AErrorEnum.BadRequest)
    }

    isUnauthorized() {
        return this.is(AErrorEnum.Unauthorized)
    }

    isPaymentRequired() {
        return this.is(AErrorEnum.PaymentRequired)
    }

    isForbidden() {
        return this.is(AErrorEnum.Forbidden)
    }

    noMatched() {
        return [AErrorEnum.NoRows, AErrorEnum.NotFound, AErrorEnum.Gone].includes(this.code)
    }

    isTimeout() {
        return this.is(AErrorEnum.Timeout)
    }

    isConflict() {
        return this.is(AErrorEnum.Conflict)
    }

    isGone() {
        return this.is(AErrorEnum.Gone)
    }

    isUnsupportedMediaType() {
        return this.is(AErrorEnum.UnsupportedMediaType)
    }

    isLocked() {
        return this.is(AErrorEnum.Locked)
    }

    isFailedDependency() {
        return this.is(AErrorEnum.FailedDependency)
    }

    isTooEarly() {
        return this.is(AErrorEnum.TooEarly)
    }
    isTooManyRequests() {
        return this.is(AErrorEnum.TooManyRequests)
    }
    isRetryWith() {
        return this.is(AErrorEnum.RetryWith)
    }

    isIllegal() {
        return this.is(AErrorEnum.Illegal)
    }

    isInternalServerError() {
        return this.is(AErrorEnum.InternalServerError)
    }

    isNotImplemented() {
        return this.is(AErrorEnum.NotImplemented)
    }

    isBadGateway() {
        return this.is(AErrorEnum.BadGateway)
    }

    isServerException() {
        return this.is(AErrorEnum.ServerException)
    }

    isGatewayTimeout() {
        return this.is(AErrorEnum.GatewayTimeout)
    }

    isBandwidthLimitExceeded() {
        return this.is(AErrorEnum.BandwidthLimitExceeded)
    }

    isServerStatusException() {
        return this.is(AErrorEnum.ServerStatusException)
    }

    isClientThrow() {
        return this.is(AErrorEnum.ClientThrow)
    }

    log() {
        if (this.isOK()) {
            return
        }
        if (this.isServerErrors()) {
            log.error(this.toString())
        } else {
            log.warn(this.toString())
        }
    }

}