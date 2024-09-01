/** @typedef {struct} LoginResponseData */
/** @typedef {struct} Profile */

/** @typedef {struct} Vuser */
/** @typedef {'main'|'selected'|{vtype:number}} VuserCondition */

class AaAccount {
    name = 'aa-account'

    static TableName = 'auth_account'
    static MainVtype = 0

    castVuid = uint64
    castVtype = uint8

    #profile
    /** @type BigInt */
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


    drop() {
        this.#db.drop(AaAccount.TableName)
    }

    /**
     * @param {?Vuser[]} [vusers]
     * @param {number} vtype
     * @return {?Vuser}
     */
    findByVtype(vusers, vtype) {
        if (!vusers) {
            return null
        }
        for (let i = 0; i < vusers.length; i++) {
            let vuser = vusers[i]
            if (this.castVtype(vuser['vtype']) === this.castVtype(vtype)) {
                return vuser
            }
        }
        return null
    }

    /**
     * @param {?Vuser[]} [vusers]
     * @param {BigInt} vuid
     * @return {?Vuser}
     */
    findVuser(vusers, vuid) {
        if (!vusers) {
            return null
        }
        for (let i = 0; i < vusers.length; i++) {
            let vuser = vusers[i]
            if (this.castVuid(vuser['vuid']) === this.castVuid(vuid)) {
                return vuser
            }
        }
        return null
    }

    /**
     * @param profile
     * @return {?Profile}
     */
    formatProfile(profile) {
        if (!profile) {
            return null
        }
        profile['vuser']['vuid'] = this.castVuid(profile['vuser']['vuid'])
        profile['vuser']['vtype'] = this.castVtype(profile['vuser']['vtype'])
        if (profile['doppes']) {
            for (let i = 0; i < profile['doppes'].length; i++) {
                profile['doppes'][i]['vuid'] = this.castVuid(profile['doppes'][i]['vuid'])
                profile['doppes'][i]['vtype'] = this.castVtype(profile['doppes'][i]['vtype'])
            }
        }
        return profile
    }


    /**
     * @param {VuserCondition} condition
     * @return {?Vuser}
     */
    getCachedVuser(condition) {
        if (condition === 'selected') {
            return this.getCachedSelectedVuser()
        }
        if (condition === 'main') {
            return this.getCachedMainVuser()
        }
        if (condition.vtype) {
            return this.getCachedByVtype(condition.vtype)
        }
        return null
    }

    /**
     * @return {?Vuser}
     */
    getCachedByVtype(vtype) {
        let profile = this.getCachedProfile()
        if (!profile) {
            return null
        }
        vtype = this.castVtype(vtype)
        if (vtype === AaAccount.MainVtype) {
            return profile['vuser']
        }
        return this.findByVtype(profile['doppes'], vtype)
    }

    /**
     * @return {?Vuser}
     */
    getCachedMainVuser() {
        return this.getCachedByVtype(AaAccount.MainVtype)
    }

    /**
     * @return {?Profile}
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

    /**
     * @return {?Vuser}
     */
    getCachedSelectedVuser() {
        let profile = this.getCachedProfile()
        if (!profile) {
            return null
        }
        let vuid = this.#selectedVuid
        if (eq(vuid, 0)) {
            vuid = this.#readSelectedVuid()
        }
        const main = profile['vuser']
        if (eq(vuid, 0) || main['vuid'] === vuid) {
            return profile['vuser']
        }
        return this.findVuser(profile['doppes'], vuid)
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
     * Last selected vuser, default is main vuser
     * @return {Promise<Vuser>}
     */
    getSelectedVuser() {
        let vuid = this.#selectedVuid
        if (eq(vuid, 0)) {
            vuid = this.#readSelectedVuid()
        }
        if (eq(vuid, 0)) {
            return this.mainVuser()
        }
        return this.getVuser(vuid)
    }

    /**
     * Get vuser
     * @param {BigInt} vuid
     * @return {Promise<Vuser>}
     */
    getVuser(vuid) {
        return this.getVusers().then(vusers => {
            const vuser = this.findVuser(vusers, vuid)
            if (vuser) {
                return vuser
            }
            throw new TypeError(`not found vuser ${vuid}`)
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
     * Get main vuser
     * @return {Promise<Vuser>}
     */
    mainVuser() {
        return this.searchVuser(AaAccount.MainVtype)
    }

    /**
     *
     * @param {Vuser} vuser
     * @return {?Profile} profile
     */
    modifyVuser(vuser) {
        let profile = this.getCachedProfile()
        if (!profile) {
            return profile
        }
        vuser['vuid'] = this.castVuid(vuser['vuid'])
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


    /**
     *
     * @param {LoginResponseData} data
     * @return {boolean}
     */
    save(data) {
        let ok = this.#auth.setToken(data['token'], data['fields'])
        if (!ok) {
            return false
        }
        return this.saveProfile(data['profile'])
    }

    saveProfile(profile) {
        this.#profile = profile
        this.#db.save(AaAccount.TableName, profile)
        return true
    }

    /**
     * @param {VuserCondition} condition
     * @return {Promise<Vuser>}
     */
    vuser(condition) {
        if (condition === 'selected') {
            return aa.account.getSelectedVuser()
        }
        if (condition === 'main') {
            return aa.account.mainVuser()
        }
        if (condition.vtype) {
            return aa.account.searchVuser(condition.vtype)
        }
        return APromiseReject("no matched vuser: " + string(condition))
    }

    /**
     * Get vuser with vtype
     * @param {number|string} vtype
     * @return {Promise<?Vuser>}
     */
    searchVuser(vtype) {
        vtype = this.castVtype(vtype)
        return this.getVusers().then(vusers => {
            return this.findByVtype(vusers, vtype)
        })
    }

    /**
     * @param {BigInt} vuid
     */
    setSelectedVuid(vuid) {
        this.#selectedVuid = this.castVuid(vuid)
        this.#db.save(AaAccount.TableName, {'selected_vuid_': vuid})
    }


    #readSelectedVuid() {
        return this.#db.find(AaAccount.TableName, 'selected_vuid_')
    }
}