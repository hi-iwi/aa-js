/**
 * @import _aaAuth
 * @typedef {{[key:string]:any}} struct
 */

class _aaAccount {
    name = 'aa-account'

    static TableName = 'aa_auth_account_profile'
    #profile
    // @type _aaCache
    #db
    #auth
    #fetch

    #fetchUrl

    initFetchUrl(url) {
        this.#fetchUrl = url
    }

    /**
     *
     * @param {_aaCache} db
     * @param auth
     * @param {_aaFetch} fetch
     */
    constructor(db, auth, fetch) {
        this.#db = db
        this.#auth = auth
        this.#fetch = fetch

    }

    /**
     *
     * @param {boolean} [refresh]  false on  [program cache] -> [local storage] -> [remote api]; true on [remote api] only
     * @return {null|*}
     */
    profile(refresh = false) {
        if (!this.#auth.authed()) {
            return null
        }

        const self = _aaAccount
        if (!refresh) {
            let profile = this.#profile
            if (len(profile) > 0) {
                return new Promise((resolve, _) => {
                    resolve(profile)
                })
            }
            profile = this.#db.select(self.TableName)
            if (len(profile) > 0) {
                this.#profile = profile
                return new Promise((resolve, _) => {
                    resolve(profile)
                })
            }
        }
        const fetch = this.#fetch
        const url = this.#fetchUrl
        if (!url || !fetch) {
            return new Promise((_, reject) => {
                reject("invalid profile fetch")
            })
        }
        return fetch.fetch(url).then(profile => {
            this.#profile = profile
            this.#db.save(self.TableName, profile)
            return profile
        })
    }

}