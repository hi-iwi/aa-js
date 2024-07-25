// @import _aaStorageFactor, _aaURI, _aaRawFetch, _aaAuth
/**
 * Ajax 包括：XMLHttpRequest 、fetch 等
 */
class _aaFetch {
    name = 'aa-fetch'

    // @type _aaRawFetch
    #rawFetch
    // @type _aaAuth
    #auth

    // @type typeof _aaURI
    #uri

    enableRedirect = true  // 是否允许自动跳转

    deleteHasBody = false  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE

    /**
     * 对 _aaRawFetch settings 扩展
     * @type {{mustAuth?:boolean, onAuthError?:function, preventTokenRefresh?:boolean}}
     */
    #defaultSettingsExt = {
        mustAuth: false,    //  must validate access_token before fetching
        // @param {AError} err
        onAuthError        : void nif,
        preventTokenRefresh: false,
    }

    initGlobalHeaders(headers) {
        this.#rawFetch.initGlobalHeaders(headers)
        return this
    }

    /**
     * @param {typeof _aaURI} uri
     * @param {_aaRawFetch} rawFetch
     * @param {_aaAuth} auth
     */
    constructor(uri, rawFetch, auth) {
        this.#uri = uri
        this.#rawFetch = rawFetch
        this.#auth = auth
    }


    addGlobalHeaders(headers) {
        this.#rawFetch.addGlobalHeaders(headers)
        return this
    }

    // 一定要用static，防止传递过程中this指向问题
    fetchHook(settings) {
        // API不判断cookie，就不用考虑CSRF攻击
        let authorization = this.#auth.getAuthorization()

        if (authorization) {
            settings.headers[aparam.Authorization] = authorization
        } else if (settings.mustAuth) {
            return new Promise((resolve, reject) => {
                reject(new AError(AErrorEnum.Unauthorized, settings.dictionary))
            })
        }
    }

    /**
     *
     * @param  {RequestInfo|string} url
     *  @example 'https://luexu.com'
     *  @example 'GET https://luexu.com'
     * @param settings
     * @param {boolean} noThrown?  No AError/Error thrown
     * @return {*}
     * @exmaple async mode 异步模式，返回结果顺序不固定
     *  aa.fetch.fetch(urlA).then().catch()
     *  aa.fetch.fetch(urlB).then().catch()
     *  @example  using await to sync mode  顺序执行，非异步
     *  async function x(){
     *      try{
     *          const dataA = await aa.fetch.fetch(urlA)   // 这里直接返回 data
     *          const dataB = await aa.fetch.fetch(urlB)
     *          console.log(dataA, dataB)     --> 按顺序执行，先执行完urlA，并返回结果后，再等urlB返回结果。
     *      } catch(err){
     *      }
     *  }
     *  x()
     */
    fetch(url, settings, noThrown = false) {
        settings = map.fillUp(settings, this.#defaultSettingsExt)
        const response = this.#rawFetch.fetch(url, settings, this.fetchHook.bind(this))
        return response.then(data => data).catch(err => {
            if (this.enableRedirect && err.isRetryWith()) {
                location.href = err.message // 特殊跳转
                return
            }
            if (err.isUnauthorized()) {
                if (typeof settings.onAuthError === "function" && settings.onAuthError(err)) {
                    return
                }
                if (this.#auth.triggerUnauthorized(`${settings.method} ${url}`)) {
                    return
                }
            }

            if (noThrown && err.triggerDisplay()) {
                return
            }
            throw err
        })
    }


    /**
     * Fetch without auth
     * @param url
     * @param settings
     */
    fetchA(url, settings) {
        settings = struct(settings)
        settings.mustAuth = false
        return this.fetch(url, settings)
    }


    status(url, settings) {
        settings = map.fillUp(settings, this.#defaultSettingsExt)
        const response = this.#rawFetch.status(url, settings, this.fetchHook.bind(this))
        return response.then(code => code)   // 不用 catch error
    }

    // /**
    //  * 同步获取data
    //  */
    // async getData(url, params, dictionary) {
    //     try {
    //         const data = await this.get(url, params, dictionary)
    //     }
    // }

    /**
     * HTTP GET
     * @param {string} url
     * @param {{[key:string]:any}} [params]
     * @param {{[key:string]:any}} [dictionary]
     * @param {boolean} noThrown?  No AError/Error thrown
     * @return {Promise<*>}
     */
    get(url, params, dictionary, noThrown = false) {
        const settings = {
            method    : "GET",
            dictionary: dictionary,
        }
        // @type _aaURI
        const uri = new this.#uri(url, params)
        return this.fetch(uri.toString(), settings, noThrown)
    }
    
    /**
     * HTTP HEAD without AError/Error thrown
     * @param {string} url
     * @param {{[key:string]:any}} [params]
     * @param {{[key:string]:any}} [dictionary]
     * @param {boolean} noThrown?  No AError/Error thrown
     * @return {Promise<*>}
     * @warn Warning: A response to a HEAD method should not have a body. If it has one anyway, that body must be ignored
     *  HEAD只返回 resp['code'] 或 HTTP状态码，忽略 resp['data'] 数据
     */
    head(url, params, dictionary, noThrown = false) {
        const settings = {
            method    : 'HEAD',
            data      : data,
            dictionary: dictionary,
        }
        return this.status(url, settings, noThrown)     // 不用 catch error
    }

    /**
     * HTTP DELETE
     * @param {string} url
     * @param {{[key:string]:any}} [params]
     * @param {{[key:string]:any}} [dictionary]
     * @param {boolean} noThrown?  No AError/Error thrown
     * @return {Promise<*>}
     */
    delete(url, params, dictionary, noThrown = false) {
        let settings = {
            method    : 'DELETE',
            data      : params,
            dictionary: dictionary,
            mustAuth  : true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
        }

        if (!this.deleteHasBody) {
            const uri = new this.#uri(url, params)
            url = uri.toString()
            delete settings.data
        }

        return this.fetch(url, settings, noThrown)
    }


    deleteA(url, params, dictionary) {
        const settings = {
            method    : 'DELETE',
            data      : params,
            dictionary: dictionary,
            mustAuth  : false,
        }
        return this.fetch(url, settings, false)
    }


    /**
     * HTTP POST
     * @param {string} url
     * @param {{[key:string]:any}} [data]
     * @param {{[key:string]:any}} [dictionary]
     * @param {boolean} noThrown?  No AError/Error thrown
     * @return {Promise<*>}
     */
    post(url, data, dictionary, noThrown = false) {
        const settings = {
            method    : 'POST',
            data      : data,
            dictionary: dictionary,
            mustAuth  : true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
        }
        return this.fetch(url, settings, noThrown)
    }


    postA(url, data, dictionary) {
        const settings = {
            method    : 'POST',
            data      : data,
            dictionary: dictionary,
            mustAuth  : false,
        }
        return this.fetch(url, settings, false)
    }


    /**
     * HTTP PUT
     * @param {string} url
     * @param {{[key:string]:any}} [data]
     * @param {{[key:string]:any}} [dictionary]
     * @param {boolean} noThrown?  No AError/Error thrown
     * @return {Promise<*>}
     */
    put(url, data, dictionary, noThrown = false) {
        const settings = {
            method    : 'PUT',
            data      : data,
            dictionary: dictionary,
            mustAuth  : true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
        }
        return this.fetch(url, settings, noThrown)
    }


    putA(url, data, dictionary) {
        const settings = {
            method    : 'PUT',
            data      : data,
            dictionary: dictionary,
            mustAuth  : false,
        }
        return this.fetch(url, settings, false)
    }


    /**
     * HTTP PATCH
     * @param {string} url
     * @param {{[key:string]:any}} [data]
     * @param {{[key:string]:any}} [dictionary]
     * @param {boolean} noThrown?  No AError/Error thrown
     * @return {Promise<*>}
     */
    patch(url, data, dictionary, noThrown = false) {
        const settings = {
            method    : 'PATCH',
            data      : data,
            dictionary: dictionary,
            mustAuth  : true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
        }
        return this.fetch(url, settings, noThrown)
    }


    patchA(url, data, dictionary) {
        const settings = {
            method    : 'PATCH',
            data      : data,
            dictionary: dictionary,
            mustAuth  : false,
        }
        return this.fetch(url, settings, false)
    }


}