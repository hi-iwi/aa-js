/**
 * @import AaStorageFactor, AaAuth, AaFetch
 *
 */
class AaAuthOpenid {
    name = 'aa-auth-openid'

    /** @type {AaStorageEngine} */
    #storageEngine

    /** @type {AaAuth} */
    #auth

    /** @type {AaFetch} */
    #fetch

    /** @type {string} */
    #fetchUrl

    #openid
    #keyName

    /**
     *
     * @param {string} url
     */
    initFetchUrl(url) {
        this.#fetchUrl = url
    }

    /**
     *
     * @param {AaStorageEngine} storageEngine
     * @param {AaAuth} auth
     * @param {AaFetch} fetch
     */
    constructor(storageEngine, auth, fetch) {
        this.#storageEngine = storageEngine
        this.#auth = auth
        this.#fetch = fetch
        this.#keyName = ['aa', 'auth', 'openid'].join(storageEngine.separator)
    }


    getOpenidCache() {
        const k = this.#keyName
        const exp = this.#storageEngine.getItem(k + '_expires_in')
        const now = time.unix()
        if (exp === null || parseInt(exp) < now + 1.8 * time.Second) {
            return null
        }
        return this.#storageEngine.getItem(k)
    }

    setOpenidCache(openid, expiresIn) {
        const k = this.#keyName
        const now = time.unix()
        const exp = now + int32(expiresIn)
        this.#storageEngine.setItem(k, openid)
        this.#storageEngine.setItem(k + "_expires_in", exp)
    }

    /**
     *
     * @param {boolean} forceRefresh
     * @return {Promise<?string>|*}
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
     * @param {boolean} forceRefresh
     * @return {Promise<{Authorization: *, "X-Openid": *}>}
     */
    fetchHeaders(forceRefresh = false) {
        return this.#auth.getAuthorization().then(authorization => {
            return this.fetch(forceRefresh).then(openid => {
                // 动态更新 header
                return {
                    'Authorization': authorization,
                    'X-Openid'     : openid,
                }
            })
        })
    }
}