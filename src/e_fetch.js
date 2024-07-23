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
            } else if (settings.mustAuthed) {
                return new Promise((resolve, reject) => {
                    reject(new AError(AErrorEnum.Unauthorized, settings.dictionary))
                })
            }
        }


        let method = settings['method']
        if (len(settings, 'data') > 0) {

        }
    }

    async fetch(url, settings) {
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

    async get(url, params, hash) {
        url = new this.#uri(url, params, hash)
        const settings = {}
        return this.fetch(url, settings)
    }

    async head(url, data) {
        const settings = {
            method: 'HEAD',
            data  : data,
        }
        return this.fetch(url, settings)
    }

    async post(url, data) {
        const settings = {
            method: 'POST',
            data  : data,
        }
        return this.fetch(url, settings)
    }

    async put(url, data) {
        const settings = {
            method: 'PUT',
            data  : data,
        }
        return this.fetch(url, settings)
    }

    async patch(url, data) {
        const settings = {
            method: 'PATCH',
            data  : data,
        }
        return this.fetch(url, settings)
    }

    async delete(url, data) {
        const settings = {
            method: 'DELETE',
            data  : data,
        }
        return this.fetch(url, settings)
    }
}