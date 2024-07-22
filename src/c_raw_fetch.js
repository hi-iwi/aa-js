// @import _aaStorageFactor, _aaURI

class _aaRawFetch {
    name = 'aa-raw-fetch'

    // @type _aaStorageFactor
    #storage
    // @type _aaURI
    #uri


    #headers = {
        'Content-Type': "application/json",
        'Accept'      : "application/json"
    }

    #requestInit = {
        // 对 RequestInit 扩展了:
        mustAuthed: false,    //  must validate access_token before fetching
        // @param {AError} err
        onAuthError        : err => alert(err.toString()),
        data               : null, // 扩展了一个 data, map, body所有属性
        debounce           : true,   // debounce 节流：n秒内只运行一次，重复操作无效；throttle 防抖：n秒后执行事件，期间被重复触发，则重新计时
        dictionaries       : null,  // 扩展了一个字典
        preventTokenRefresh: false,

        // RequestInit:
        // body:{},  String, ArrayBuffer, TypedArray, DataView, Blob, File, URLSearchParams, FormData
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
        signal        : null,
        // window        : null,
    }

    /**
     * @param {_aaStorageFactor} storage
     * @param {_aaURI} uri
     */
    constructor(storage, uri) {
        this.#storage = storage
        this.#uri = uri
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

    // 默认对 image/images/audio/audios/video/videos 等类型进行替换
    fillSettings(settings) {
        settings = map.fillUp(settings, this.#requestInit)
        settings.headers = this.#fillUpHeaders(settings.headers)
        return settings
    }

    // @TODO support other content-types
    serializeData(data, contentType = 'application/json') {
        //  这里会识别对象的 .toJSON() 方法
        return JSON.stringify(data)
    }


    handleData(url, settings) {
        const data = settings.data
        if (settings.body || len(data) === 0) {
            return [url, settings]
        }

        // String, ArrayBuffer, TypedArray, DataView, Blob, File, URLSearchParams, FormData
        if (!atype.isStruct(data)) {
            settings.body = data
            return settings
        }
        const contentType = string(settings.headers, 'Content-Type')
        settings.body = this.serializeData(data, contentType)
    }

    lookup(method, url, data) {
        if (len(data) === 0) {
            return [url, data]
        }

        /*
           根据 iris 路由规则来
            /api/v1/{name:uint64}/hello
            /api/v1/{name}
          */
        // const uri =
        // let queries;
        // [url, queries] = new this.#uri(url, data).lookup()
        // data = queries.object
        // 判定是否还有未替换的url param
        // if (/\/{[\w:]+}/.test(url)) {
        //     AaEffect.Alert("unreplaced url parameters " + params.url)
        //     return
        // }


        if (len(data) === 0) {
            return [url, data]
        }
        if (["GET", "HEAD", "OPTION"].includes(method)) {
            for (let [k, v] of Object.entries(data)) {
                if (Array.isArray(v)) {
                    data[k] = v.join(",")  // GET 下，数组用逗号隔开模式
                }
            }

            url = new this.#uri(url, data).toString()
            data = null   // 这里不重置，会传递两次
        }
        return [url, data]
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
            method: "GET",
            // body:{},
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