/**
 * @import AaStorageFactor, AaURI
 * @typedef {struct|string} RequestData
 */

class AaRawFetch {
    name = 'aa-raw-fetch'

/** @type {AaStorageFactor} */
    #storage


    /** @type {map} */
    #requests

    #cleanTimer
    #headers = {
        'Content-Type': "application/json",
        'Accept'      : "application/json"
    }

    #defaultSettings = {
        // 对 RequestInit 扩展了:
        // mustAuth: false,    //  must validate access_token before fetching
        // @param {AError} err
        //onAuthError: err => alert(err.toString()),
        data: null, // 扩展了一个 data, map
        /**
         * 这里是后端限流、防止短时间重复提交的意思，只是借用防抖的名词，跟前端点击防抖不一样
         * debounce 防抖：延时间隔内，触发相同事件，则忽略之前未执行的事件，重新计算间隔
         * throttle 节流：每个延时间隔内，相同事件无论触发多少次，都仅执行一次
         */
        debounce  : true,
        dictionary: null,  // 扩展了一个字典
        //preventTokenRefresh: false,

        // RequestInit:
        body: null, //  String, ArrayBuffer, TypedArray, DataView, Blob, File, URLSearchParams, FormData
        //cache:"default", //
        credentials: "omit", // omit 不发送cookie；same-origin 仅同源发送cookie；include 发送cookie
        //headers: headers,
        // integrity:"",
        keepalive: false,
        method   : "GET",
        /**
         * If the mode option is set to no-cors, then method must be one of GET, POST or HEAD.
         * By default, mode is set to cors
         */
        mode          : "cors",  // same-origin 同源；cors 允许跨域；no-cors ; navigate
        redirect      : "error", // follow 自动跳转；manual 手动跳转；error 报错
        referrer      : "",  //A string whose value is a same-origin URL, "about:client", or the empty string, to set request's referrer.
        referrerPolicy: "no-referrer",
        signal        : null, // window        : null,
    }

    initGlobalHeaders(headers) {
        if (atype.isStruct(headers)) {
            this.#headers = headers
        }
    }

    /**
     * @param {AaStorageFactor} storage
     */
    constructor(storage) {
        this.#storage = storage
        this.#requests = new map()
    }


    addGlobalHeaders(headers) {
        this.#headers = {...this.#headers, ...headers}
    }


    /**
     *
     *     根据 iris 路由规则来
     *     /api/v1/{name:uint64}/hello
     *     /api/v1/{name}
     * @param method
     * @param url
     * @param data
     * @param isDataAllQueryString
     * @return {[string, any]}
     */
    lookup(method, url, data, isDataAllQueryString = false) {
        if (len(data) === 0) {
            return [url, null]
        }

        if (isDataAllQueryString || ["GET", "HEAD", "OPTION", "DELETE"].includes(method)) {
            const p = new AaURI(url, data).parse()
            if (!p.ok) {
                throw new SyntaxError(`miss parameter(s) in url: ${method} ${url} ${JSON.stringify(data)}`)
            }
            return [p.url, null]
        }

        let queries, ok;
        [url, queries, ok] = AaURI.lookup(url, data)
        if (!ok) {
            throw new SyntaxError(`miss parameter(s) in url: ${method} ${url} ${JSON.stringify(data)}`)
        }

        if (len(queries) === 0) {
            return [url, null]
        }

        return [url, queries]
    }

    /**
     *
     * @param {object|struct} value
     * @return {*}
     */
    unpackData(value) {
        if (!value) {
            return value
        }
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return null
            }
            let isBitset = true
            for (let i = 0; i < value.length; i++) {
                const v = this.unpackData(value[i])
                if (!value[i] || value[i].hasOwnProperty('jsonbitset') || (typeof v !== 'number' && !(typeof v === "string" && /^\d+$/.test(v)))) {
                    isBitset = false
                }
                value[i] = v
            }
            /**
             * `jsonbitset` is a reserved json field ot indicate the value of this struct is a bit. Once it is in an array,
             *      it should be calculated.
             */
            if (isBitset) {
                let bitset = 0
                for (let i = 0; i < value.length; i++) {
                    bitset |= 1 << number(value[i])
                }
                return bitset
            }
        }
        // .toJSON() 会被 JSON.stringify 识别，这里处理一下也无妨，以后扩展其他类型也更方便
        if (typeof value.toJSON === "function") {
            return value.toJSON()
        }

        /**
         * `jsonkey` is a reserved json field to indicate the value of the key name of this struct.
         *  1. `jsonkey` field must be a string. It can be an empty string.
         *  2. if `jsonkey` is not an empty string, its value is the key name of the value of this struct
         *  3. if `jsonkey` is an empty string, try the `value` or `id` or `path` properties
         */
        if (typeof value.jsonkey === "string") {
            let key = value.jsonkey ? value.jsonkey : (value.hasOwnProperty('value') ? 'value' : (value.hasOwnProperty('id') ? 'id' : 'path'))
            if (value.hasOwnProperty(key)) {
                return value[key]
            }
        }
        return value
    }

    // @TODO support other content-types
    serializeData(data, contentType = 'application/json') {
        for (const [key, value] of Object.entries(data)) {
            if (value !== null && typeof value === "object") {
                data[key] = this.unpackData(value)
            }
        }
        try {
            //  这里会识别对象的 .toJSON() 方法
            return JSON.stringify(data)
        } catch (e) {
            log.error(e.toString(), data)
        }
        return ''
    }


    /**
     * Merge headers with global headers
     * @param {{[key:string]}} [headers]
     * @return {struct}
     */
    #fillUpHeaders(headers) {
        // 填充以  X- 开头的自定义header
        headers = struct(headers)
        this.#storage.forEachEntire((key, value) => {
            if (key.indexOf('X-') === 0) {
                headers[key] = value
            }
        })
        map.fillUp(headers, this.#headers,(k, v, target) => {
            if (!target.hasOwnProperty(k)) {
                target[k] = v
            } else {
                if (typeof target[k] === "undefined" || target[k] === null) {
                    delete target[k]
                }
            }
        })

        return headers
    }


    /**
     *
     * @param {RequestInfo} url
     * @param {struct} settings
     * @return {(*|Object)[]|(*|Object)[]}
     */
    formatSettings(url, settings) {
        let headers = settings.headers

        settings = map.fillUp(settings, this.#defaultSettings)   // 要允许外面扩展配置

        headers = this.#fillUpHeaders(headers)
        let contentType = headers['Content-Type']
        if (!contentType) {
            contentType = 'application/json'
            headers['Content-Type'] = contentType
        }
        settings.method = string(settings, 'method', 'GET').toUpperCase()
        settings.headers = headers  // 先不要使用 new Headers()， 容易出现莫名其妙的问题。直接让fetch自己去转换


        const data = settings.data
        if (len(data) === 0) {
            return [url, settings]
        }
        let queries;
        [url, queries] = this.lookup(settings.method, url, data, !!settings.body)
        if (len(queries) > 0 && !settings.body) {
            settings.body = this.serializeData(data, contentType)
        }
        return [url, settings]
    }


    autoClean() {
        if (this.#cleanTimer) {
            return
        }
        this.#cleanTimer = setTimeout(() => {
            const now = new Date().valueOf()
            this.#requests.forEach((key, value) => {
                if (value + 400 * time.Millisecond > now) {
                    this.#requests.delete(key)
                }
            })
            clearTimeout(this.#cleanTimer)
            this.autoClean()
        }, time.Second)
    }

    debounce(method, url, body) {
        this.autoClean()

        const checksum = AaRawFetch.generateChecksum(method, url, body)
        // 0.4秒内不能重复提交相同数据
        const interval = 400 * time.Millisecond
        const now = new Date().valueOf()  // in milliseconds
        const prev = this.#requests.get(checksum)
        if (!prev || prev + interval > now) {
            this.#requests.set(checksum, now)
            return true
        }
        return false
    }

    /**
     *
     * @param {RequestInfo|string} url
     *  @example 'https://luexu.com'
     *  @example 'GET https://luexu.com'
     * @param {struct|*} [settings]
     * @return {[string, any ]|Promise}
     */
    middleware(url, settings) {
        settings = struct(settings)
        const parts = url.trim().split(' ')
        if (parts.length > 1) {
            let method = parts[0].toUpperCase()
            if (['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'].includes(method)) {
                settings.method = method
                url = parts.slice(1).join(' ')
            }
        }

        [url, settings] = this.formatSettings(url, settings)
        if (settings.debounce) {
            if (!this.debounce(settings.method, url, settings.body)) {
                return new Promise((resolve, reject) => {
                    log.debug(`${settings.method} ${url} is blocked by debounce`)
                    reject(new AError(AErrorEnum.TooManyRequests, settings.dictionary))
                })
            }
        }

        const uri = new AaURI(url, {"_stringify": booln(true)})
        return [uri.toString(), settings]
    }

    rawFetch(url, settings) {
        // 如果使用 response = await fetch();  json= await response.json() 必须要await，阻塞等待response返回
        // 这里就不用await最好，外面使用的时候，再自行 await
        return fetch(url, settings).then(resp => {
            let err = new AError(resp.status)
            if (!err.isOK()) {
                throw err
            }
            const method = string(settings, 'method', 'GET')
            if (method === 'HEAD') {
                return {
                    code: AErrorEnum.OK,
                    msg : AErrorEnum.code2Msg(AErrorEnum.OK),
                }
            }
            try {
                return resp.json()
            } catch (error) {
                throw  new AError(AErrorEnum.ClientThrow, `response '${resp.text()}' is not valid JSON`)
            }
        }).then(resp => {
            // 捕获返回数据，修改为 resp.data
            const err = new AError(resp['code'], resp['msg'])
            if (!err.isOK()) {
                throw err
            }
            return resp['data']
        }).catch(err => {
            throw  err instanceof AError ? err : new AError(AErrorEnum.ClientThrow, err.toString())
        })
    }

    /**
     * Fetch data
     * @param {RequestInfo|string} url
     *  @example 'https://luexu.com'
     *  @example 'GET https://luexu.com'
     * @param {struct|*} [settings]
     * @param {function(settings:{struct}):Promise} [hook]
     * @return {Promise<*>}
     */
    fetch(url, settings, hook) {
        // 这里 settings.headers 会被转为 new Headers(settings.headers)
        const mw = this.middleware(url, settings);
        [url, settings] = [mw[0], mw[1]]

        if (hook) {
            return hook(settings).then(() => {
                return this.rawFetch(url, settings)
            })
        }
        return this.rawFetch(url, settings)
    }

    rawStatus(url, settings) {
        return fetch(url, settings).then(resp => {
            let err = new AError(resp.status)
            if (!err.isOK()) {
                return Number(resp.status)
            }
            return resp.json()
        }).then(resp => typeof resp === "number" ? resp : number(resp, 'code'))
    }

    /**
     * Get HTTP status code without AError/Error thrown
     * @param {RequestInfo} url
     * @param {struct|*} [settings]
     * @param {function} [hook]
     * @return {Promise<*>}
     */
    status(url, settings, hook) {
        const mw = this.middleware(url, settings);
        [url, settings] = [mw[0], mw[1]]
        if (hook) {
            return hook(settings).then(() => {
                return this.rawStatus(url, settings)
            })
        }
        return this.rawStatus(url, settings)
    }


    /**
     * @param {File} file
     * @return {string}
     */
    static fileChecksum(file) {
        return `#${file.size}|${file.type}|${file.lastModified}|${file.name}|${file.webkitRelativePath}`
    }

    static stringChecksum(s) {
        const length = s.length
        if (length < 1024) {
            return `#${length}|${s}`
        }
        const l = Math.floor(length / 2)
        let s2 = s.substring(0, 256) + s.substring(l - 256, l + 256) + s.substring(length - 256)
        return `#${length}>|${s2}`
    }

    /**
     *
     * @param method
     * @param url
     * @param body
     * @todo support ArrayBuffer, TypedArray, DataView, Blob, File, URLSearchParams, FormData
     */
    static generateChecksum(method, url, body) {
        let checksum = `${method} ${url}`
        if (!body) {
            return checksum
        }

        let content = ''
        if (body instanceof File) {
            content = AaRawFetch.fileChecksum(body)
        } else if (body instanceof FormData) {
            for (const pair of body) {
                let v = pair[1] instanceof File ? AaRawFetch.fileChecksum(pair[1]) : pair[1]
                content = '&' + pair[0] + '=' + v
            }
            content = content.substring(1)
            content = `#${content.length}|${content}`
        } else if (typeof body === "string") {
            content = AaRawFetch.stringChecksum(body)
        }
        return `${method} ${url} {${content}}`
    }
}