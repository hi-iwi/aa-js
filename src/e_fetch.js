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
    #unauthorizedHandler
    // @type typeof _aaURI
    #uri

    /**
     * 对 _aaRawFetch settings 扩展
     * @type {{mustAuth?:boolean, onAuthError?:function, preventTokenRefresh?:boolean}}
     */
    #defaultSettingsExt = {
        mustAuth: false,    //  must validate access_token before fetching
        // @param {AError} err
        onAuthError        : err => alert(err.toString()),
        preventTokenRefresh: false,
    }


    /**
     * @param {_aaURI} uri
     * @param {_aaRawFetch} rawFetch
     * @param {_aaAuth} auth
     * @param {function} [unauthorizedHandler]
     */
    constructor(uri, rawFetch, auth, unauthorizedHandler) {
        this.#uri = uri
        this.#rawFetch = rawFetch
        this.#auth = auth
        this.#unauthorizedHandler = typeof unauthorizedHandler === "function" ? unauthorizedHandler : void nif
    }

    setUnauthorizedHandler(unauthorizedHandler) {
        this.#unauthorizedHandler = typeof unauthorizedHandler === "function" ? unauthorizedHandler : void nif
    }

    initGlobalHeaders(headers) {
        this.#rawFetch.initGlobalHeaders(headers)
    }

    addGlobalHeaders(headers) {
        this.#rawFetch.addGlobalHeaders(headers)
    }


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
    fetch(url, settings) {
        settings = map.fillUp(settings, this.#defaultSettingsExt)
        const response = this.#rawFetch.fetch(url, settings, this.fetchHook)
        return response.then(data => data).catch(err => {
            if (err.isRetryWith()) {
                location.href = err.message // 特殊跳转
            } else if (err.isUnauthorized() && typeof this.#unauthorizedHandler === "function") {
                this.#unauthorizedHandler()
            }
            throw err
        })
    }
    status(url,settings){
        settings = map.fillUp(settings, this.#defaultSettingsExt)
        const response = this.#rawFetch.status(url, settings, this.fetchHook)
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
     * @return {Promise<*>}
     */
    get(url, params, dictionary) {
        const settings = {
            method    : "GET",
            dictionary: dictionary,
        }
        url = new this.#uri(url, params)
        return this.fetch(url, settings)
    }


    /**
     * HTTP HEAD
     * @param {string} url
     * @param {{[key:string]:any}} [params]
     * @param {{[key:string]:any}} [dictionary]
     * @return {Promise<*>}
     * @warn Warning: A response to a HEAD method should not have a body. If it has one anyway, that body must be ignored
     *  HEAD只返回 resp['code'] 或 HTTP状态码，忽略 resp['data'] 数据
     */
    head(url, params, dictionary) {
        const settings = {
            method    : 'HEAD',
            data      : data,
            dictionary: dictionary,
        }
        return this.status(url, settings)     // 不用 catch error
    }

    /**
     * HTTP DELETE
     * @param {string} url
     * @param {{[key:string]:any}} [params]
     * @param {{[key:string]:any}} [dictionary]
     * @return {Promise<*>}
     */
    delete(url, params, dictionary) {
        const settings = {
            method    : 'DELETE',
            data      : data,
            dictionary: dictionary,
            mustAuth  : true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
        }
        return this.fetch(url, settings)
    }

    /**
     * HTTP POST
     * @param {string} url
     * @param {{[key:string]:any}} [data]
     * @param {{[key:string]:any}} [dictionary]
     * @return {Promise<*>}
     */
    post(url, data, dictionary) {
        const settings = {
            method    : 'POST',
            data      : data,
            dictionary: dictionary,
            mustAuth  : true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
        }
        return this.fetch(url, settings)
    }

    /**
     * HTTP PUT
     * @param {string} url
     * @param {{[key:string]:any}} [data]
     * @param {{[key:string]:any}} [dictionary]
     * @return {Promise<*>}
     */
    put(url, data, dictionary) {
        const settings = {
            method    : 'PUT',
            data      : data,
            dictionary: dictionary,
            mustAuth  : true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
        }
        return this.fetch(url, settings)
    }

    /**
     * HTTP PATCH
     * @param {string} url
     * @param {{[key:string]:any}} [data]
     * @param {{[key:string]:any}} [dictionary]
     * @return {Promise<*>}
     */
    patch(url, data, dictionary) {
        const settings = {
            method    : 'PATCH',
            data      : data,
            dictionary: dictionary,
            mustAuth  : true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
        }
        return this.fetch(url, settings)
    }
}