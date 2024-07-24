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
        if (!settings.preventTokenRefresh) {
            // try to refresh access token
            let authorization = this.#auth.getAuthorization()
            if (authorization) {
                settings.headers[aparam.Authorization] = authorization
            } else if (settings.mustAuth) {
                return new Promise((resolve, reject) => {
                    reject(new AError(AErrorEnum.Unauthorized, settings.dictionary))
                })
            }
        }
    }

    /**
     *
     * @param url
     * @param settings
     * @param {boolean} noThrown?  No Error/AError thrown
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
                if (this.#auth.triggerUnauthorized()) {
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
     * Fetch without Error/AError thrown
     * @param url
     * @param settings
     * @return {*}
     */
    fetchN(url, settings) {
        return this.fetch(url, settings, true)
    }

    statusN(url, settings) {
        settings = map.fillUp(settings, this.#defaultSettingsExt)
        const response = this.#rawFetch.statusN(url, settings, this.fetchHook.bind(this))
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
     * @param {boolean} noThrown?  No Error/AError thrown
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

    getN(url, params, dictionary) {
        return this.get(url, params, dictionary, true)
    }

    /**
     * HTTP HEAD without Error/AError thrown
     * @param {string} url
     * @param {{[key:string]:any}} [params]
     * @param {{[key:string]:any}} [dictionary]
     * @param {boolean} noThrown?  No Error/AError thrown
     * @return {Promise<*>}
     * @warn Warning: A response to a HEAD method should not have a body. If it has one anyway, that body must be ignored
     *  HEAD只返回 resp['code'] 或 HTTP状态码，忽略 resp['data'] 数据
     */
    headN(url, params, dictionary, noThrown = false) {
        const settings = {
            method    : 'HEAD',
            data      : data,
            dictionary: dictionary,
        }
        return this.statusN(url, settings, noThrown)     // 不用 catch error
    }

    /**
     * HTTP DELETE
     * @param {string} url
     * @param {{[key:string]:any}} [params]
     * @param {{[key:string]:any}} [dictionary]
     * @param {boolean} noThrown?  No Error/AError thrown
     * @return {Promise<*>}
     */
    delete(url, params, dictionary, noThrown = false) {
        const settings = {
            method    : 'DELETE',
            data      : data,
            dictionary: dictionary,
            mustAuth  : true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
        }
        return this.fetch(url, settings, noThrown)
    }

    deleteN(url, params, dictionary) {
        return this.delete(url, params, dictionary, true)
    }

    /**
     * HTTP POST
     * @param {string} url
     * @param {{[key:string]:any}} [data]
     * @param {{[key:string]:any}} [dictionary]
     * @param {boolean} noThrown?  No Error/AError thrown
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

    postN(url, data, dictionary) {
        return this.post(url, data, dictionary, true)
    }

    /**
     * HTTP PUT
     * @param {string} url
     * @param {{[key:string]:any}} [data]
     * @param {{[key:string]:any}} [dictionary]
     * @param {boolean} noThrown?  No Error/AError thrown
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

    putN(url, data, dictionary) {
        return this.put(url, data, dictionary, true)
    }

    /**
     * HTTP PATCH
     * @param {string} url
     * @param {{[key:string]:any}} [data]
     * @param {{[key:string]:any}} [dictionary]
     * @param {boolean} noThrown?  No Error/AError thrown
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

    patchN(url, data, dictionary) {
        return this.patch(url, data, dictionary, true)
    }
}