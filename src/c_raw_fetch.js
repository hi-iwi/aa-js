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

    #requestInit = {
        // 对 RequestInit 扩展了:
        mustAuthed: false,    //  must validate access_token before fetching
        // @param {AError} err
        onAuthError        : err => alert(err.toString()),
        data               : null, // 扩展了一个 data, map
        debounce           : true,   // debounce 节流：n秒内只运行一次，重复操作无效；throttle 防抖：n秒后执行事件，期间被重复触发，则重新计时
        dictionaries       : null,  // 扩展了一个字典
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


    // 默认对 image/images/audio/audios/video/videos 等类型进行替换
    fillSettings(settings) {
        settings = map.fillUp(settings, this.#requestInit)
        settings.headers = this.#fillUpHeaders(settings.headers)
        return settings
    }

    formatSettings(url, settings) {
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
    fileChecksum(file) {
        return `#${file.size}|${file.type}|${file.lastModified}|${file.name}|${file.webkitRelativePath}`
    }

    stringChecksum(s) {
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
            content = this.fileChecksum(body)
        } else if (body instanceof FormData) {
            for (const pair of body) {
                let v = pair[1] instanceof File ? this.fileChecksum(pair[1]) : pair[1]
                content = '&' + pair[0] + '=' + v
            }
            content = content.substring(1)
            content = `#${content.length}|${content}`
        } else if (typeof body === "string") {
            content = this.stringChecksum(body)
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
        const checksum = _aaRawFetch.generateChecksum(method, url, body)
        // 0.4秒内不能重复提交相同数据
        // const now = new Date().valueOf()  // in milliseconds
        // const prev = this.#requests.get(checksum)
        // if (!prev || prev + 400*time.Millisecond > now) {
        //     this.#requests.set(checksum, now)
        //
        //
        //     return
        // }
        //
        //
        // this.autoClean()
        //
        // const duration = 1
        // const now = Math.floor(new Date().getTime() / 400)
        // const prev = intMax(_aaUrlsFetchedAt, hash)
        // const dur = prev + duration - now
        // if (dur > 0) {
        //     XmlAjax.handleAjaxError(params, new AError(AErrorEnum.Timeout, '', dict))
        //     console.error(params.method + " " + params.url + ' data: ' + d + " too frequent, please retry in " + dur + " seconds")
        //     return
        // }
        //
        // this.#requests.set(checksum, now)
        // _aaUrlsFetchedAt[hash] = now
    }


    /**
     *
     * @param {RequestInfo} url
     * @param {{[key:string]:any}|*} [settings]
     * 对 RequestInit 扩展了:
     *      mustAuthed:false      must validate access_token before fetching
     *      onAuthError: err:AError=>void
     *      data:{}
     *      debounce:true    debounce 节流：n秒内只运行一次，重复操作无效；throttle 防抖：n秒后执行事件，期间被重复触发，则重新计时
     *      dictionaries:{}
     *      preventTokenRefresh:false
     *
     * RequestInit:
     *      method: "GET"
     * @param {function} [hook]
     * @return {Promise<Response>}
     */
    async fetch(url, settings, hook) {
        settings = this.fillSettings(settings)
        if (hook) {
            const h = hook(settings)
            if (h instanceof Promise) {
                return h
            }
        }
        [url, settings] = this.formatSettings(url, settings)
        if (settings.debounce) {

        }


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

    /**
     * @param {string} url
     * @param {{[key:string]:*}} [params]
     * @param {string} [fragment]
     * @return {Promise<Response>}
     */
    async get(url, params, fragment) {
        let headers = this.#fillUpHeaders(init)
        url = new _aaURI(url, params, fragment).toString()
        const response = await fetch(url, {
            method     : "GET", // body:{},
            cache      : "default", //
            credentials: "omit", // omit 不发送cookie；same-origin 仅同源发送cookie；include 发送cookie
            headers    : headers,

            mode    : "no-cors",  // same-origin 同源；cors 允许跨域；no-cors; navigate
            redirect: "error", // follow 自动跳转；manual 手动跳转；error 报错
            // integrity:"",
            referrerPolicy: "no-referrer",
        })
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