// @import AaStorageFactor, AaURI, AaRawFetch, AaAuth
/**
 * Ajax 包括：XMLHttpRequest 、fetch 等
 */
class AaFetch {
    name = 'aa-fetch'

    // @type {AaRawFetch}
    #rawFetch

    // @type {AaAuth}
    #auth


    enableRedirect = true  // 是否允许自动跳转

    deleteHasBody = false  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE

    /**
     * 对 AaRawFetch settings 扩展
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
     * @param {AaRawFetch} rawFetch
     * @param {AaAuth} auth
     */
    constructor(rawFetch, auth) {
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
        return this.#auth.getAuthorization().then(authorization => {
            if (authorization) {
                settings.headers[aparam.Authorization] = authorization
            } else if (settings.mustAuth) {
                throw new AError(AErrorEnum.Unauthorized, settings.dictionary)
            }
        })
    }

    /**
     * HTTP Fetch
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [settings]
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
                const method = string(settings, 'method')
                if (this.#auth.triggerUnauthorized(`${method} ${url}`)) {
                    return
                }
            }
            throw err
        })
    }


    /**
     * Fetch without authorization
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [settings]
     */
    fetchA(url, settings) {
        map.set(settings, 'mustAuth', false)
        return this.fetch(url, settings)
    }

    /**
     * Fetch without AError/Error thrown
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [settings]
     * @note can also using .fetch.then(resolve, err=>{err.triggerDisplay})
     */
    fetchN(url, settings) {
        return this.fetch(url, settings).catch(AError.alert)
    }

    /**
     * Fetch without authorization and without AError/Error thrown
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [settings]
     */
    fetchNA(url, settings) {
        map.set(settings, 'mustAuth', false)
        return this.fetchN(url, settings)
    }

    /**
     * Get HTTP status code
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [settings]
     * @return {Promise<*>}
     */
    status(url, settings) {
        settings = map.fillUp(settings, this.#defaultSettingsExt)
        const response = this.#rawFetch.status(url, settings, this.fetchHook.bind(this))
        return response.then(code => code)
    }

    /**
     * Get HTTP status code without AError/Error thrown
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [settings]
     * @return {Promise<*>}
     */
    statusN(url, settings) {
        return this.status(url, settings).catch(err => {
            err = aerror(err)
            const method = string(settings, 'method')
            err.log(`${method} ${url} status error: %ERROR`)
        })
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
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [params]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    get(url, params, dictionary) {
        const settings = {
            method    : "GET",
            dictionary: dictionary,
        }
        const uri = new AaURI(url, params)
        return this.fetch(uri.toString(), settings)
    }

    /**
     * HTTP GET without AError/Error thrown
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [params]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    getN(url, params, dictionary) {
        return this.get(url, params, dictionary).catch(AError.alert)
    }

    /**
     * HTTP HEAD
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [params]
     * @param {struct} [dictionary]
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
     * HTTP HEAD without AError/Error thrown
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [params]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     * @warn Warning: A response to a HEAD method should not have a body. If it has one anyway, that body must be ignored
     *  HEAD只返回 resp['code'] 或 HTTP状态码，忽略 resp['data'] 数据
     */
    headN(url, params, dictionary) {
        return this.head(url, params, dictionary).catch(AError.alert)
    }

    /**
     * HTTP DELETE
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [params]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    delete(url, params, dictionary) {
        let settings = {
            method    : 'DELETE',
            data      : params,
            dictionary: dictionary,
            mustAuth  : true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
        }

        if (!this.deleteHasBody) {
            const uri = new AaURI(url, params)
            url = uri.toString()
            delete settings.data
        }

        return this.fetch(url, settings)
    }

    /**
     * HTTP DELETE without AError/Error thrown
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [params]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    deleteN(url, params, dictionary) {
        return this.delete(url, params, dictionary).catch(AError.alert)
    }

    /**
     * HTTP DELETE without authorization
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [params]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    deleteA(url, params, dictionary) {
        const settings = {
            method    : 'DELETE',
            data      : params,
            dictionary: dictionary,
            mustAuth  : false,
        }
        return this.fetchA(url, settings)
    }

    /**
     * HTTP DELETE without authorization and without AError/Error thrown
     * @param  {RequestURL|RequestInfo} url
     * @param {struct} [params]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    deleteNA(url, params, dictionary) {
        return this.deleteA(url, params, dictionary).catch(AError.alert)
    }

    /**
     * HTTP POST
     * @param  {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dictionary]
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
     * HTTP POST without authorization
     * @param  {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    postA(url, data, dictionary) {
        const settings = {
            method    : 'POST',
            data      : data,
            dictionary: dictionary,
            mustAuth  : false,
        }
        return this.fetchA(url, settings)
    }

    /**
     * HTTP POST without AError/Error thrown
     * @param  {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    postN(url, data, dictionary) {
        return this.post(url, data, dictionary).catch(AError.alert)
    }

    /**
     * HTTP POST without authorization and without AError/Error thrown
     * @param  {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    postNA(url, data, dictionary) {
        return this.postA(url, data, dictionary).catch(AError.alert)
    }

    /**
     * HTTP PUT
     * @param  {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dictionary]
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
     * HTTP PUT without authorization
     * @param  {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    putA(url, data, dictionary) {
        const settings = {
            method    : 'PUT',
            data      : data,
            dictionary: dictionary,
            mustAuth  : false,
        }
        return this.fetchA(url, settings)
    }

    /**
     * HTTP PUT without AError/Error thrown
     * @param  {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    putN(url, data, dictionary) {
        return this.put(url, data, dictionary).catch(AError.alert)
    }

    /**
     * HTTP PUT without authorization and without AError/Error thrown
     * @param  {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    putNA(url, data, dictionary) {
        return this.putA(url, data, dictionary).catch(AError.alert)
    }

    /**
     * HTTP PATCH
     * @param  {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dictionary]
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

    /**
     * HTTP PATCH without authorization
     * @param  {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    patchA(url, data, dictionary) {
        const settings = {
            method    : 'PATCH',
            data      : data,
            dictionary: dictionary,
            mustAuth  : false,
        }
        return this.fetchA(url, settings)
    }

    /**
     * HTTP PATCH without AError/Error thrown
     * @param  {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    patchN(url, data, dictionary) {
        return this.patch(url, data, dictionary).catch(AError.alert)
    }

    /**
     * HTTP PATCH without authorization and without AError/Error thrown
     * @param  {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dictionary]
     * @return {Promise<*>}
     */
    patchNA(url, data, dictionary) {
        return this.patchA(url, data, dictionary).catch(AError.alert)
    }
}