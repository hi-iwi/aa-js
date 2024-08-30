/**  @typedef {{mustAuth?:boolean, onAuthError?:function, preventTokenRefresh?:boolean, mode?: string, redirect?: string, debounce?: boolean, referrer?: string, dict?: struct, data?: struct, method?: string, referrerPolicy?: string, credentials?: string, keepalive?: boolean, body?: any, signal?: any, window:? any}} FetchSettings */
class AaFetch {
    name = 'aa-fetch'

    /** @type {AaRawFetch} */
    #rawFetch

    /** @type {AaAuth}*/
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
            if (!authorization) {
                throw new AError(AErrorEnum.Unauthorized, '', settings.dict)
            }
            settings.headers[aparam.Authorization] = authorization
        }).catch(err => {
            if (settings.mustAuth) {
                throw err instanceof AError ? err : new AError(AErrorEnum.Unauthorized, err.toString(), settings.dict)
            }
        })
    }

    /**
     * HTTP Fetch
     * @param {RequestURL|RequestInfo} url
     * @param {FetchSettings} [settings]
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
            err = aerror(err)
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
     * @param {RequestURL|RequestInfo} url
     * @param {FetchSettings} [settings]
     */
    fetchA(url, settings) {
        map.set(settings, 'mustAuth', false)
        return this.fetch(url, settings)
    }

    /**
     * Fetch without AError/Error thrown
     * @param {RequestURL|RequestInfo} url
     * @param {FetchSettings} [settings]
     * @note can also using .fetch.then(resolve, err=>{err.triggerDisplay})
     */
    fetchN(url, settings) {
        return this.fetch(url, settings).catch(AError.alert)
    }

    /**
     * Fetch without authorization and without AError/Error thrown
     * @param {RequestURL|RequestInfo} url
     * @param {FetchSettings} [settings]
     */
    fetchNA(url, settings) {
        map.set(settings, 'mustAuth', false)
        return this.fetchN(url, settings)
    }

    /**
     * Get HTTP status code
     * @param {RequestURL|RequestInfo} url
     * @param {FetchSettings} [settings]
     * @return {Promise<*>}
     */
    status(url, settings) {
        settings = map.fillUp(settings, this.#defaultSettingsExt)
        const response = this.#rawFetch.status(url, settings, this.fetchHook.bind(this))
        return response.then(code => code)
    }

    /**
     * Get HTTP status code without AError/Error thrown
     * @param {RequestURL|RequestInfo} url
     * @param {FetchSettings} [settings]
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
    // async getData(url, params, dict) {
    //     try {
    //         const data = await this.get(url, params, dict)
    //     }
    // }

    /**
     * HTTP GET
     * @param {RequestURL|RequestInfo} url
     * @param {struct|map|URLSearchParams} [params]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    get(url, params, dict) {
        const settings = {
            method: "GET",
            dict  : dict,
        }
        const uri = new AaURI(url, params)
        return this.fetch(uri.toString(), settings)
    }

    /**
     * HTTP GET without AError/Error thrown
     * @param {RequestURL|RequestInfo} url
     * @param {struct|map|URLSearchParams} [params]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    getN(url, params, dict) {
        return this.get(url, params, dict).catch(AError.alert)
    }

    /**
     * HTTP HEAD
     * @param {RequestURL|RequestInfo} url
     * @param {struct|map|URLSearchParams} [params]
     * @param {struct} [dict]
     * @return {Promise<*>}
     * @warn Warning: A response to a HEAD method should not have a body. If it has one anyway, that body must be ignored
     *  HEAD只返回 resp['code'] 或 HTTP状态码，忽略 resp['data'] 数据
     */
    head(url, params, dict) {
        const settings = {
            method: 'HEAD',
            data  : params,
            dict  : dict,
        }
        return this.status(url, settings)     // 不用 catch error
    }

    /**
     * HTTP HEAD without AError/Error thrown
     * @param {RequestURL|RequestInfo} url
     * @param {struct|map|URLSearchParams} [params]
     * @param {struct} [dict]
     * @return {Promise<*>}
     * @warn Warning: A response to a HEAD method should not have a body. If it has one anyway, that body must be ignored
     *  HEAD只返回 resp['code'] 或 HTTP状态码，忽略 resp['data'] 数据
     */
    headN(url, params, dict) {
        return this.head(url, params, dict).catch(AError.alert)
    }

    /**
     * HTTP DELETE
     * @param {RequestURL|RequestInfo} url
     * @param {struct|map|URLSearchParams} [params]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    delete(url, params, dict) {
        let settings = {
            method  : 'DELETE',
            data    : params,
            dict    : dict,
            mustAuth: true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
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
     * @param {RequestURL|RequestInfo} url
     * @param {struct|map|URLSearchParams} [params]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    deleteN(url, params, dict) {
        return this.delete(url, params, dict).catch(AError.alert)
    }

    /**
     * HTTP DELETE without authorization
     * @param {RequestURL|RequestInfo} url
     * @param {struct|map|URLSearchParams} [params]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    deleteA(url, params, dict) {
        const settings = {
            method  : 'DELETE',
            data    : params,
            dict    : dict,
            mustAuth: false,
        }
        return this.fetchA(url, settings)
    }

    /**
     * HTTP DELETE without authorization and without AError/Error thrown
     * @param {RequestURL|RequestInfo} url
     * @param {struct|map|URLSearchParams} [params]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    deleteNA(url, params, dict) {
        return this.deleteA(url, params, dict).catch(AError.alert)
    }

    /**
     * Detect url resource ready
     * @param {string} url
     * @param {(string)=>void} onReady
     * @param {number} [retry]
     * @param {number} [size]
     * @param {number} [retryInterval]
     */
    detect(url, onReady, size, retry, retryInterval) {
        if (!retryInterval) {
            if (size > 10 * math.MB) {
                retryInterval = 8 * time.Second
            } else if (size > math.MB) {
                retryInterval = (Math.floor(size / (2 * math.MB)) + 3) * time.Second
            } else if (size > 300 * math.KB) {
                retryInterval = 2 * time.Second
            } else if (size > 0) {
                retryInterval = time.Second
            } else {
                const ext = AaPath.ext()
                if ([".avi", ".mov", ".mp4", ".mpeg", ".3gp", ".3g2", ".wav", ".webm"].includes(ext)) {
                    // video
                    retryInterval = 8 * time.Second
                } else if ([".aiff", ".3gp", ".3g2", ".webm", ".wav", ".mp3"].includes(ext)) {
                    // audio
                    retryInterval = 3 * time.Second
                } else if ([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".gif", ".heic", ".jpg", ".png", ".webp"].includes(ext)) {
                    // pdf/doc/image about 200KB~800KB
                    retryInterval = 2 * time.Second
                } else {
                    retryInterval = time.Second
                }
            }
        }


        fetch(url, {method: "HEAD"}).then(res => {
            if (!res.ok) {
                throw new Error(`fetch url http code: ${res.status}`)
            }
            onReady(url)
        }).catch(err => {
            log.error(`detect ${url}`, err)
            if (!retry) {
                return
            }
            setTimeout(() => {
                this.detect(url, onReady, retry - 1, retryInterval * 2)
            }, retryInterval)
        })
    }

    /**
     * HTTP POST
     * @param {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    post(url, data, dict) {
        const settings = {
            method  : 'POST',
            data    : data,
            dict    : dict,
            mustAuth: true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
        }
        return this.fetch(url, settings)
    }

    /**
     * HTTP POST without authorization
     * @param {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    postA(url, data, dict) {
        const settings = {
            method  : 'POST',
            data    : data,
            dict    : dict,
            mustAuth: false,
        }
        return this.fetchA(url, settings)
    }

    /**
     * HTTP POST without AError/Error thrown
     * @param {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    postN(url, data, dict) {
        return this.post(url, data, dict).catch(AError.alert)
    }

    /**
     * HTTP POST without authorization and without AError/Error thrown
     * @param {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    postNA(url, data, dict) {
        return this.postA(url, data, dict).catch(AError.alert)
    }

    /**
     * HTTP PUT
     * @param {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    put(url, data, dict) {
        const settings = {
            method  : 'PUT',
            data    : data,
            dict    : dict,
            mustAuth: true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
        }
        return this.fetch(url, settings)
    }

    /**
     * HTTP PUT without authorization
     * @param {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    putA(url, data, dict) {
        const settings = {
            method  : 'PUT',
            data    : data,
            dict    : dict,
            mustAuth: false,
        }
        return this.fetchA(url, settings)
    }

    /**
     * HTTP PUT without AError/Error thrown
     * @param {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    putN(url, data, dict) {
        return this.put(url, data, dict).catch(AError.alert)
    }

    /**
     * HTTP PUT without authorization and without AError/Error thrown
     * @param {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    putNA(url, data, dict) {
        return this.putA(url, data, dict).catch(AError.alert)
    }

    /**
     * HTTP PATCH
     * @param {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    patch(url, data, dict) {
        const settings = {
            method  : 'PATCH',
            data    : data,
            dict    : dict,
            mustAuth: true,   // GET/HEAD/OPTION 默认false; POST/PUT/PATCH/DELETE 默认 true
        }
        return this.fetch(url, settings)
    }

    /**
     * HTTP PATCH without authorization
     * @param {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    patchA(url, data, dict) {
        const settings = {
            method  : 'PATCH',
            data    : data,
            dict    : dict,
            mustAuth: false,
        }
        return this.fetchA(url, settings)
    }

    /**
     * HTTP PATCH without AError/Error thrown
     * @param {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    patchN(url, data, dict) {
        return this.patch(url, data, dict).catch(AError.alert)
    }

    /**
     * HTTP PATCH without authorization and without AError/Error thrown
     * @param {RequestURL|RequestInfo} url
     * @param {RequestData} [data]
     * @param {struct} [dict]
     * @return {Promise<*>}
     */
    patchNA(url, data, dict) {
        return this.patchA(url, data, dict).catch(AError.alert)
    }
}