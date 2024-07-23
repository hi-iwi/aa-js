// @import _aaStorageFactor, _aaURI

class _aaRawFetch {
    name = 'aa-raw-fetch'

    // @type _aaStorageFactor
    #storage

    // @type typeof _aaURI
    #uri

    // @type map
    #requests

    #cleanTimer


    #headers = {
        'Content-Type': "application/json",
        'Accept'      : "application/json"
    }
    /**
     *
     * @type {{redirect: string, data: null, method: string, referrerPolicy: string, credentials: string, keepalive: boolean, mustAuthed: boolean, preventTokenRefresh: boolean, body: null, onAuthError: function(*): void, mode: string, debounce: boolean, referrer: string, dictionary: null, signal: null}}
     */
    #requestInit = {
        // 对 RequestInit 扩展了:
        mustAuthed: false,    //  must validate access_token before fetching
        // @param {AError} err
        onAuthError: err => alert(err.toString()),
        data       : null, // 扩展了一个 data, map
        /**
         * debounce 防抖：延时间隔内，触发相同事件，则忽略之前未执行的事件，重新计算间隔
         * throttle 节流：每个延时间隔内，相同事件无论触发多少次，都仅执行一次
         */
        debounce           : true,
        dictionary         : null,  // 扩展了一个字典
        preventTokenRefresh: false,

        // RequestInit:
        body: null, //  String, ArrayBuffer, TypedArray, DataView, Blob, File, URLSearchParams, FormData
        //cache:"default", //
        credentials: "omit", // omit 不发送cookie；same-origin 仅同源发送cookie；include 发送cookie
        //headers: headers,
        // integrity:"",
        keepalive     : false,
        method        : "GET",
        mode          : "no-cors",  // same-origin 同源；cors 允许跨域；no-cors; navigate
        redirect      : "error", // follow 自动跳转；manual 手动跳转；error 报错
        referrer      : "",  //A string whose value is a same-origin URL, "about:client", or the empty string, to set request's referrer.
        referrerPolicy: "no-referrer",
        signal        : null, // window        : null,
    }

    /**
     * @param {_aaStorageFactor} storage
     * @param {typeof _aaURI} uri
     */
    constructor(storage, uri) {
        this.#storage = storage
        this.#uri = uri
        this.#requests = new map()
    }

    initGlobalHeaders(headers) {
        this.#headers = headers ? headers : {}
    }

    addGlobalHeaders(headers) {
        this.#headers = {...this.#headers, ...headers}
    }

    /**
     * Merge headers with global headers
     * @param {{[key:string]}} [headers]
     * @return {{[key:string]:*}}
     */
    #fillUpHeaders(headers) {
        // 填充以  X- 开头的自定义header
        headers = struct(headers)
        this.#storage.forEachEntire((key, value) => {
            if (key.indexOf('X-') === 0) {
                headers[key] = value
            }
        })
        map.fillUp(headers, this.#headers, (k, v, target) => {
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

    /*
    根据 iris 路由规则来
    /api/v1/{name:uint64}/hello
    /api/v1/{name}
    */
    lookup(method, url, data, isDataAllQueryString = false) {
        if (len(data) === 0) {
            return [url, null]
        }

        if (isDataAllQueryString || ["GET", "HEAD", "OPTION"].includes(method)) {
            const p = new this.#uri(url, data).parse()
            if (!p.ok) {
                throw new SyntaxError("miss parameter(s) in url: " + p.url)
            }
            return [p.url, null]
        }

        let queries, ok;
        [url, queries, ok] = this.#uri.lookup(url, data)
        if (ok) {
            throw new AError(AErrorEnum.BadRequest, "miss parameter(s) in url: " + p.url)
        }

        if (len(queries) === 0) {
            return [url, null]
        }

        return [url, queries]
    }

    // @TODO support other content-types
    serializeData(data, contentType = 'application/json') {
        //  这里会识别对象的 .toJSON() 方法
        return JSON.stringify(data)
    }

    /**
     *
     * @param url
     * @param {{redirect: string, data: null, method: string, referrerPolicy: string, credentials: string, keepalive: boolean, mustAuthed: boolean, preventTokenRefresh: boolean, body: null, onAuthError: function(*): void, mode: string, debounce: boolean, referrer: string, dictionary: null, signal: null}|*} settings
     * @return {(*|Object)[]|(*|Object)[]}
     */
    formatSettings(url, settings) {
        settings = map.fillUp(settings, this.#requestInit)
        settings.headers = this.#fillUpHeaders(settings.headers)
        settings.method = settings.method.toUpperCase()
        const data = settings.data
        if (len(data) === 0) {
            return [url, settings]
        }
        let queries;
        [url, queries] = this.lookup(settings.method, url, data, !!settings.body)
        if (len(queries) > 0 && !settings.body) {
            const contentType = string(settings.headers, 'Content-Type')
            settings.body = this.serializeData(data, contentType)
        }
        return [url, settings]
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
        const self = _aaRawFetch
        let checksum = `${method} ${url}`
        if (!body) {
            return checksum
        }

        let content = ''
        if (body instanceof File) {
            content = self.fileChecksum(body)
        } else if (body instanceof FormData) {
            for (const pair of body) {
                let v = pair[1] instanceof File ? self.fileChecksum(pair[1]) : pair[1]
                content = '&' + pair[0] + '=' + v
            }
            content = content.substring(1)
            content = `#${content.length}|${content}`
        } else if (typeof body === "string") {
            content = self.stringChecksum(body)
        }
        return `${method} ${url} {${content}}`
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
        const self = _aaRawFetch
        this.autoClean()

        const checksum = self.generateChecksum(method, url, body)
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
     * @param {RequestInfo} url
     * @param {{[key:string]:any}|*} [settings]
     * 对 RequestInit 扩展了:
     *      mustAuthed:false      must validate access_token before fetching
     *      onAuthError: err:AError=>void
     *      data:{}
     *      debounce:true
     *      dictionary:{}
     *      preventTokenRefresh:false
     *
     * RequestInit:
     *      method: "GET"
     * @param {function} [hook]
     * @return {Promise<Response>}
     */
    async fetch(url, settings, hook) {
        [url, settings] = this.formatSettings(url, settings)

        if (hook) {
            const h = hook(settings)
            if (h instanceof Promise) {
                return h
            }
        }
        if (settings.debounce) {
            if (!this.debounce(settings.method, url, settings.body)) {
                return new Promise((resolve, reject) => {
                    log.warn(`${settings.method} ${url} is blocked by debounce`)
                    reject(new AError(AErrorEnum.TooManyRequests, settings.dictionary))
                })
            }
        }
        url = new this.#uri(url, {"_stringify": booln(true)}).toString()
        const response = await fetch(url, settings)
        return response.json().then(resp => {
            // 捕获返回数据，修改为 resp.data
            const err = new AError(resp['code'], resp['msg'])
            if (err.isOK()) {
                return resp['data']
            }
            throw err.addHeading(url)
        }).catch(err => {
            if (err instanceof AError) {
                throw err
            } else {
                throw  new AError(AErrorEnum.ClientThrow, err.toString())
            }
        })
    }

 
}