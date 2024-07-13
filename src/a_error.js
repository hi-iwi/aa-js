const aerror = {
    Ok       : 200,
    NoContent: 204,

    BadParam       : 400,
    Unauthorized   : 401,
    PaymentRequired: 402,
    Forbidden      : 403,
    NotFound       : 404,// refer to redis.Nil, sql.ErrNoRows
    Timeout        : 408, // 被限流也是返回这个
    Conflict       : 409,
    Gone           : 410,              // 以前存在过，以后都不会再存在了，表示数据已经删除、过期、失效
    BadMediaType   : 415, // 上传的数据格式非法
    // code:444, data:null   表示空数组返回这个错误，表示不可以再进行下一页查询了
    // code:200/204, data:[]  空数组，表示查询到了数据，但是数据过滤完了，可以尝试下一页查询
    NoRows          : 444,
    Locked          : 423,
    FailedDependency: 424,// 之前发生错误
    RetryWith       : 449,  // 特殊错误码，msg 用于跳转
    Illegal         : 451,// 该请求因法律原因不可用。

    InternalServerError   : 500,
    NotImplemented        : 501, // 服务器不支持当前请求所需要的某个功能。当服务器无法识别请求的方法，
    BadGateway            : 502,  //
    ServerException       : 503,  // 客户端自定义，表示未知服务端错误；最常见的就是，没有正确返回数据，或者返回 {code:0,msg:""} 等未协商的数据，导致客户端无法正常处理
    GatewayTimeout        : 504,
    BandwidthLimitExceeded: 509,
    StatusException       : 555,  // http 状态码出错，未达到程序阶段
    ClientThrow           : 556, // 捕获js catch的报错
    dict                  : {
        'zh-CN': {
            "ok"                           : "成功",
            "no content"                   : "成功",
            "bad param"                    : "参数错误",
            "unauthorized"                 : "请登录授权后使用",
            "payment required"             : "请付费后使用",
            "forbidden"                    : "您没有权限使用",
            "not found"                    : "糟糕，数据找不到啦~",
            "request timeout"              : "请求超时，请稍后再试",
            "conflict"                     : "异常冲突",
            "key conflict"                 : "冲突或已被占用",
            "gone"                         : "数据已被删除",
            "unsupported media type"       : "文件格式不正确",
            "no rows"                      : "没有数据啦",
            "locked"                       : "资源已被锁定",
            "failed dependency"            : "之前发生错误",
            "unavailable for legal reasons": "因法律原因不可用",
            "internal server error"        : "服务端错误",
            "not implemented"              : "拒绝服务",
            "bad gateway"                  : "上游服务异常",
            "server exception"             : "服务端异常",
            "gateway timeout"              : "上游服务器超时",
            "bandwidth limit exceeded"     : "访问太频繁，临时限制访问",
            "server status exception"      : "服务器状态异常",
        }
    },
    Messages              : function () {
        return [
            {
                value: this.Ok,
                text : "ok"
            },
            {
                value: this.NoContent,
                text : "no content"
            },
            {
                value: this.BadParam,
                text : "bad param"
            },
            {
                value: this.Unauthorized,
                text : "unauthorized"
            },
            {
                value: this.PaymentRequired,
                text : "payment required"
            },
            {
                value: this.Forbidden,
                text : "forbidden"
            },
            {
                value: this.NotFound,
                text : "not found"
            },
            {
                value: this.Timeout,
                text : "request timeout"
            }, // 被限流也是返回这个
            {
                value: this.Conflict,
                text : "conflict"
            },
            {
                value: this.Gone,
                text : "gone"
            },              // 以前存在过，以后都不会再存在了，表示数据已经删除、过期、失效
            {
                value: this.BadMediaType,
                text : "unsupported media type"
            }, // 上传的数据格式非法
            {
                value: this.NoRows,
                text : "no rows"
            },          // @warn 自定义。空数组返回这个错误
            {
                value: this.Locked,
                text : "locked"
            },
            {
                value: this.FailedDependency,
                text : "failed dependency"
            },// 之前发生错误
            {
                value: this.Illegal,
                text : "unavailable for legal reasons"
            },// 该请求因法律原因不可用。
            {
                value: this.InternalServerError,
                text : "internal server error"
            },
            {
                value: this.NotImplemented,
                text : "not implemented"
            }, // 服务器不支持当前请求所需要的某个功能。当服务器无法识别请求的方法，
            {
                value: this.BadGateway,
                text : "bad gateway"
            },
            {
                value: this.ServerException,
                text : "server exception"
            }, {
                value: this.GatewayTimeout,
                text : "gateway timeout"
            }, {
                value: this.BandwidthLimitExceeded,
                text : "bandwidth limit exceeded"
            }, {
                value: this.StatusException,
                text : "server status exception"
            }, {
                value: this.ClientThrow,
                text : "client catch exception"
            },
        ]
    },
    /**
     * 从 options [{value:,text:}] 里面选出部分或全部选项
     * @param options
     * @param partial
     * @returns {*[]|*}
     * @constructor
     */
    _partialOptions(options, partial) {
        if (!partial) {
            return options
        }
        let part = []
        partial.map(v => {
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === v) {
                    options[i].key = part.length  // option key 顺序
                    part.push(options[i])
                    break
                }
            }
        })
        return part
    },
    options: function (partial, lang = "zh-CN") {
        let opts = this.Messages()
        if (this.dict[lang]) {
            const dict = this.dict[lang]
            opts.map((opt, i) => {
                if (dict[opt.text]) {
                    opts[i].text = dict[opt.text]
                }
            })
        }
        return this._partialOptions(opts, partial)
    },
    _queryDict(msg, dictExt, lang = 'zh-CN') {
        if (dictExt && dictExt[msg]) {
            return dictExt[msg]
        }
        if (this.dict[lang] && this.dict[lang][msg]) {
            return this.dict[lang][msg]
        }
        return ""
    },
    translate: function (code, msg, dictExt, lang = 'zh-CN') {
        let s = aerror._queryDict(msg, dictExt, lang)
        if (s) {
            return s
        }
        let a
        let arr = Array.from(msg.matchAll(/param[^`]*`([^`]+)`.*is\s+required/ig))
        for (a of arr) {
            let p = dictExt[a[1]] ? dictExt[a[1]] : a[1]
            return "请输入“" + p + "”"
        }
        arr = Array.from(msg.matchAll(/bad\s+param[^`]*`([^`]+)`/ig))
        for (a of arr) {
            let p = dictExt[a[1]] ? dictExt[a[1]] : a[1]
            return "“" + p + "”输入错误"
        }
        arr = Array.from(msg.matchAll(/param[^`]*`([^`]+)`.*not\s+match/ig))
        for (a of arr) {
            let p = dictExt[a[1]] ? dictExt[a[1]] : a[1]
            return "“" + p + "”输入不符合规则"
        }


        let zh
        let zhs = this.options([], "zh-CN")
        for (let i = 0; i < zhs.length; i++) {
            if (zhs[i].value === code) {
                zh = zhs[i].text
                break
            }
        }
        let en
        let engs = this.options([], "en-US")
        for (let i = 0; i < engs.length; i++) {
            if (engs[i].value === code) {
                en = engs[i].text
                break
            }
        }

        if (typeof msg === "undefined" || msg === en) {
            msg = zh // 转成中文，后期通过 本地 language ，来确定Msg使用哪个
        }
        return msg
    },
};

/**
 * @warn ts 下就不要继承 Error，因为ts把 Error.prototype设为私有，外面是无法访问的
 */
class AError extends Error {
    name
    code
    msg
    message

    static newBadParam(param, dict) {
        return new AError(aerror.BadParam, "bad param `" + param + "`", dict)
    }

    static newUnauthed(msg, dict) {
        return new AError(aerror.Unauthorized, msg, dict)
    }

    static newTimeout(dict) {
        return new AError(aerror.Timeout, "", dict)
    }

    static newThrow(dict) {
        return new AError(aerror.ClientThrow, "", dict)
    }

    static newResp(resp, dict) {
        if (!resp) {
            return new AError(aerror.ServerException, "", dict)
        }
        if (typeof resp === "string") {
            try {
                resp = JSON.parse(resp.trim())
            } catch (e) {
                return new AError(aerror.ServerException, "", dict)
            }
        }
        if (resp && typeof resp === "object" && resp.hasOwnProperty("code") && resp.hasOwnProperty("msg")) {
            return new AError(Number(resp['code']), String(resp['msg']), dict)
        }

        return new AError(aerror.ServerException, "", dict)
    }

    constructor(code, rawmsg, dict, lang = 'zh-CN') {
        let msg = aerror.translate(code, rawmsg, dict, lang)
        super(msg)

        this.name = "AError"
        this.code = code
        this.msg = this.message = msg
    }


    toString() {
        return this.msg + " [" + this.code + "]"
    }


    resetMsg(msg) {
        this.msg = this.message = msg


    }

    append(info) {
        this.resetMsg(this.msg + "  " + info)
        return this
    }

    log() {
        if (this.ok()) {
            return
        }
        if (this.isServerError()) {
            console.error(this.toString())
        } else {
            console.warn(this.toString())
        }
    }

    is(code) {
        return code === this.code
    }

    ok() {
        return this.code >= 200 && this.code < 300
    }

    isRetryWith() {
        return this.code === aerror.RetryWith
    }

    isConflict() {
        return this.code === aerror.Conflict
    }

    isTimeout() {
        return this.code === aerror.Timeout
    }

    isUnauthorized() {
        return this.code === aerror.Unauthorized
    }

    isForbidden() {
        return this.code === aerror.Forbidden
    }

    noMatched() {
        return [aerror.NoRows, aerror.NotFound, aerror.Gone].includes(this.code)
    }

    isServerError() {
        return this.code >= 500
    }

}