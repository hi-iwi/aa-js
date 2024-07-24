class _aaAuthOpenid {
    name = 'aa-auth-openid'
    // @type _aaStorageFactor
    #storage
    // @type _aaAuth
    #auth


    // @type {function:Promise}
    #fetchPromise

    /**
     *
     * @param {function:Promise} handler
     */
    initFetchPromise(handler) {
        this.#fetchPromise = handler
    }

    constructor(storage, auth) {
        this.#storage = storage
        this.#auth = auth
    }


    getOpenidCache() {
        const k = "aa:auth.openid"
        const exp = this.#storage.session.getItem(k + '_expires_in')
        const now = time.unix()
        if (exp === null || parseInt(exp) < now + 1.8 * time.Second) {
            return null
        }
        return this.#storage.session.getItem(k)
    }

    setOpenidCache(openid, expiresIn) {
        const k = "aa:auth.openid"
        const now = time.unix()
        const exp = now + int32(expiresIn)
        this.#storage.session.setItem(k, openid)
        this.#storage.session.setItem(k + "_expires_in", exp)
    }

    /**
     *
     * @param {boolean} forceRefresh
     * @return {Promise<unknown>|*}
     */
    fetch(forceRefresh = false) {
        if (!forceRefresh) {
            let openid = this.getOpenidCache()
            if (openid) {
                return new Promise((resolve, reject) => {
                    resolve(openid)
                })
            }
        }
        if (typeof this.#fetchPromise !== "function") {
            return new Promise((resolve, reject) => {
                reject()
            })
        }
        return this.#fetchPromise().then(data => {
            let openid = string(data['openid'])
            if (openid === "") {
                return null
            }
            const expiresIn = int32(data['expires_in'])
            this.setOpenidCache(openid, expiresIn)
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