// @import _aaStorageFactor, _aaRawFetch, _aaAuth
/**
 * Ajax 包括：XMLHttpRequest 、fetch 等
 */
class _aaFetch {
    name = 'aa-fetch'
    // @type _aaRawFetch
    #rawFetch
    // @type _aaAuth
    #auth

    /**
     * @param {_aaRawFetch} rawFetch
     * @param {_aaAuth} auth
     */
    constructor(rawFetch, auth) {
        this.#rawFetch = rawFetch
        this.#auth = auth
    }

    initGlobalHeaders(headers) {
        this.#rawFetch.initGlobalHeaders(headers)
    }

    addGlobalHeaders(headers) {
        this.#rawFetch.addGlobalHeaders(headers)
    }

    async fetch(url, settings) {
        const response = this.#rawFetch.fetch(url, settings, this.fetchHook)
        return response.then(data => data).catch(err => {

        })
    }

    /**
     * @param {AError} err
     * @return {boolean}
     */
    handleError(err) {
        err.log()
        if (err.isRetryWith()) {
            location.href = err.message // 特殊跳转
            return true
        }
        if (err.isUnauthorized() && XmlAjax.handleUnauth(params, err)) {
            sessionStorage.setItem("dbg.unauthorized ", params.method + ' ' + params.url)
            return true
        }
        const handler = XmlAjax.iAjaxError(params)
        if (handler !== null) {
            handler(err)
            return true
        }
        return false
    }

    fetchHook(settings) {
        // API不判断cookie，就不用考虑CSRF攻击

        if (!settings.preventTokenRefresh) {
            // try to refresh access token
            let authorization = this.#auth.getAuthorization()
            if (!authorization && !settings.mustAuthed) {
                return new Promise((resolve, reject) => {
                    reject(new AError(AErrorEnum.Unauthorized))
                })
            }

            settings.headers[aparam.Authorization] = authorization
        }
        if (settings.mustAuthed) {
            // check access token before fetching

        }


        let method = settings['method']
        if (len(settings, 'data') > 0) {

        }
    }
}