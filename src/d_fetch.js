/**
 * @import _aaStorage
 */

/**
 * Ajax 包括：XMLHttpRequest 、fetch 等
 */
class _aaFetch {
    name = 'aa-fetch'
    // @type _aaStorage
    #storage
    #headers = {
        'Content-Type': "application/json",
        'Accept'      : "application/json"
    }

    #requestInit = {
        // 对 RequestInit 扩展了:
        auth: false,    //  check access_token before fetching
        // @param {AError} err
        onAuthError        : err => alert(err.toString()),
        data               : {}, // 扩展了一个 data, map, body所有属性
        debounce           : true,   // debounce 节流：n秒内只运行一次，重复操作无效；throttle 防抖：n秒后执行事件，期间被重复触发，则重新计时
        dictionaries       : {},  // 扩展了一个字典
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
     *
     * @param {_aaStorageFactor} storage
     */
    constructor(storage = new _aaStorageFactor()) {
        this.#storage = storage
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
        this.#storage.forEachAll((key, value) => {
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

    /**
     *
     * @param {RequestInfo} input
     * @param {{[key:string]:*}} [init]
     * 对 RequestInit 扩展了:
     *      auth:false      自动判断并添加access_token
     *      onAuthError: err:AError=>void
     *      data:{}
     *      debounce:    debounce 节流：n秒内只运行一次，重复操作无效；throttle 防抖：n秒后执行事件，期间被重复触发，则重新计时
     *      dictionaries:{}
     *      preventTokenRefresh:false
     *
     * RequestInit:
     *      method: "GET"
     * @return {Promise<Response>}
     */
    async fetch(input, init) {
        init = struct(init)
        init.headers = this.#fillUpHeaders(struct(init, 'headers'))

        map.fillUp(init, this.#requestInit)

        if (!init.preventTokenRefresh) {
            // try to refresh access token

        }
        if (init.auth) {
            // check access token before fetching

        }


        let method = init['method']
        if (len(init, 'data') > 0) {

        }


        const response = await fetch(url, init)
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