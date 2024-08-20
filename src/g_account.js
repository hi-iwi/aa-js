/**
 * @import AaAuth
 * @typedef {struct} LoginResponseData
 * @typedef {struct} Profile
 */

class AaAccount {
    name = 'aa-account'

    static TableName = 'auth_account'
    static MainVtype = 0
    #profile
    #selectedVuid

    #lock = new AaLock()
    /** @type {AaCache} */
    #db
    /** @type {AaAuth} */
    #auth
    #fetch
    #fetchUrl


    #initProfile() {
        const profile = this.getCachedProfile()
        if (profile) {
            return
        }
        this.getProfile(true).then(nif, nif)
    }

    initFetchUrl(url) {
        this.#fetchUrl = url
        this.#auth.getToken().then(() => {
            this.#initProfile()
        }, nif)
    }

    /**
     *
     * @param {AaCache} db
     * @param {AaAuth} auth
     * @param {AaFetch} fetch
     */
    constructor(db, auth, fetch) {
        this.#db = db
        this.#auth = auth
        this.#fetch = fetch

    }

    /**
     *
     * @param {LoginResponseData} data
     * @return {boolean}
     */
    save(data) {
        let ok = this.#auth.setToken(data['token'], data['fields'])
        if(!ok){
            return false
        }
        return this.saveProfile(data['profile'])
    }

    saveProfile(profile) {
        this.#profile = profile
        this.#db.save(AaAccount.TableName, profile)
        return true
    }

    drop() {
        this.#db.drop(AaAccount.TableName)
    }

    /**
     *
     * @return {Profile|null}
     */
    getCachedProfile() {
        let profile = this.#profile
        if (len(profile) > 0) {
            return profile
        }
        profile = this.#db.selectAll(AaAccount.TableName)
        if (len(profile) === 0 || len(profile['vuser']) === 0) {
            this.#profile = null
            return null
        }
        profile = this.formatProfile(profile)
        this.#profile = profile
        return profile
    }

    formatProfile(profile) {
        if (!profile) {
            return null
        }
        profile['vuser']['vuid'] = string(profile['vuser']['vuid'])
        profile['vuser']['vtype'] = number(profile['vuser']['vtype'])
        if (profile['doppes']) {
            for (let i = 0; i < profile['doppes'].length; i++) {
                profile['doppes'][i]['vuid'] = string(profile['doppes'][i]['vuid'])
                profile['doppes'][i]['vtype'] = number(profile['doppes'][i]['vtype'])
            }
        }
        return profile
    }

    /**
     * @param {boolean} [refresh]  false on  [program cache] -> [local storage] -> [remote api]; true on [remote api] only
     * @return {Promise<Profile>|*}
     */
    getProfile(refresh = false) {
        return this.#auth.getToken().then(() => {
            if (!refresh) {
                let profile = this.getCachedProfile()
                if (len(profile) > 0) {
                    return APromiseResolve(profile)
                }
            }
            const fetch = this.#fetch
            const url = this.#fetchUrl
            if (!url || !fetch) {
                return APromiseReject("invalid profile fetch " + url)
            }

            if (this.#lock.xlock()) {
                return asleep(200 * time.Millisecond).then(() => {
                    return this.getProfile(refresh)
                })
            }
            return fetch.fetch(url, {
                mustAuth: true,
            }).then(profile => {
                profile = this.formatProfile(profile)
                this.saveProfile(profile)
                return profile
            }).catch(err => {
                this.#auth.validate()
                throw err
            }).finally(() => {
                this.#lock.unlock()
            })
        })
    }

    /**
     * Get vusers
     * @return {Promise<Vuser[]>}
     */
    getVusers() {
        return this.getProfile().then(profile => {
            let vusers = [profile['vuser']]
            let doppes = array(profile, 'doppes')
            vusers.push(...doppes)
            return vusers
        })
    }

    /**
     * Get vuser with vtype
     * @param {NumberX} vtype
     * @return {Promise<Vuser>}
     */
    searchVuser(vtype) {
        return this.getVusers().then(vusers => {
            vtype = number(vtype)
            for (let i = 0; i < vusers.length; i++) {
                let vuser = vusers[i]
                if (vuser['vtype'] === vtype) {
                    return vuser
                }
            }
            throw new TypeError(`not found vuser with vtype: ${vtype}`)
        })
    }

    /**
     * Get main vuser
     * @return {Promise<Vuser>}
     */
    mainVuser() {
        return this.searchVuser(AaAccount.MainVtype)
    }


    /**
     * Get vuser
     * @param {string} vuid
     * @return {Promise<Vuser>}
     */
    getVuser(vuid) {
        return this.getVusers().then(vusers => {
            for (let i = 0; i < vusers.length; i++) {
                let vuser = vusers[i]
                if (vuser['vuid'] === string(vuid)) {
                    return vuser
                }
            }
            throw new TypeError(`not found vuser ${vuid}`)
        })
    }

    setSelectedVuid(vuid) {
        this.#selectedVuid = vuid
        this.#db.save(AaAccount.TableName, {'selected_vuid_': vuid})
    }

    #readSelectedVuid() {
        return this.#db.find(AaAccount.TableName, 'selected_vuid_')
    }


    /**
     * Last selected vuser, default is main vuser
     * @return {Promise<Vuser>}
     */
    getSelectedVuser() {
        let vuid = this.#selectedVuid
        if (!vuid || vuid === '0') {
            vuid = this.#readSelectedVuid()
        }
        if (!vuid) {
            return this.mainVuser()
        }
        return this.getVuser(vuid)
    }

    /**
     *
     * @param {Vuser} vuser
     * @return {Profile|null} profile
     */
    modifyVuser(vuser) {
        let profile = this.getCachedProfile()
        if (!profile) {
            return profile
        }
        const vuid = vuser['vuid']
        if (profile['vuser']['vuid'] === vuid) {
            profile['vuser'] = vuser
        } else if (profile['doppes']) {
            for (let i = 0; i < profile['doppes'].length; i++) {
                if (profile['doppes'][i]['vuid'] === vuid) {
                    profile['doppes'][i] = vuser
                }
            }
        } else {
            throw new RangeError(`not found vuid ${vuid}`)
        }

        this.saveProfile(profile)
        return profile
    }
}