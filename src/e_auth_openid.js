/**
 * @import _aaStorageFactor, _aaAuth, _aaFetch
 *
 */
class _aaAuthOpenid {
    name = 'aa-auth-openid'
    // @type _aaStorageFactor
    #storage
    // @type _aaAuth
    #auth
    // @type _aaFetch
    #fetch

    // @type {string}
    #fetchUrl

    #openid

    /**
     *
     * @param {string} url
     */
    initFetchUrl(url) {
        this.#fetchUrl = url
    }

    /**
     *
     * @param {_aaStorageFactor} storage
     * @param {_aaAuth} auth
     * @param {_aaFetch} fetch
     */
    constructor(storage, auth, fetch) {
        this.#storage = storage
        this.#auth = auth
        this.#fetch = fetch
    }


    getOpenidCache() {
        const k = "aa_auth_openid"
        const exp = this.#storage.session.getItem(k + '_expires_in')
        const now = time.unix()
        if (exp === null || parseInt(exp) < now + 1.8 * time.Second) {
            return null
        }
        return this.#storage.session.getItem(k)
    }

    setOpenidCache(openid, expiresIn) {
        const k = "aa_auth_openid"
        const now = time.unix()
        const exp = now + int32(expiresIn)
        this.#storage.session.setItem(k, openid)
        this.#storage.session.setItem(k + "_expires_in", exp)
    }

    /**
     *
     * @param {boolean} forceRefresh
     * @return {Promise<string|null>|*}
     */
    fetch(forceRefresh = false) {
        if (!forceRefresh) {
            let openid = this.#openid
            if (!openid) {
                openid = this.getOpenidCache()
            }
            if (openid) {
                return new Promise((resolve, _) => {
                    resolve(openid)
                })
            }
        }
        const url = this.#fetchUrl
        const fetch = this.#fetch

        if (!url || !fetch) {
            return new Promise((resolve, reject) => {
                reject()
            })
        }
        return fetch.fetch(url).then(data => {
            let openid = string(data['openid'])
            if (openid === "") {
                return null
            }
            const expiresIn = int32(data['expires_in'])
            this.setOpenidCache(openid, expiresIn)
            this.#openid = openid
            return openid
        })
    }

    /**
     *
     * @param {boolean} forceRefresh
     * @return {Promise<{Authorization: *, "X-Openid": *}>}
     */
    fetchHeaders(forceRefresh = false) {
        return this.fetch(forceRefresh).then(openid => {
            // 动态更新 header
            return {
                'Authorization': this.#auth.getAuthorization(),
                'X-Openid'     : openid,
            }
        })
    }
}