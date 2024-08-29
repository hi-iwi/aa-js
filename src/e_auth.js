/** @typedef {{access_token: string, conflict?: boolean, expires_in?: number, refresh_api?: string, refresh_token?: string, refresh_ttl?:number, scope?: null, secure?: boolean, state?:string, token_type: string, validate_api?: string}} TokenData */


class AaAuth {
    name = 'aa-auth'

    static NoTokenError = new AError(AErrorEnum.Unauthorized, 'no token')

    /** @type ()=>string */
    cookieDomainHandler
    tx = new AaLock()
    /** @type {AaStorageFactor}   不要设为私有，要不外面使用会 attempted to get private field on non-instance */
    #storage

    /** @type {AaRawFetch} */
    #rawFetch

    /** @type {function}  外部可以使用、修改 */
    #unauthorizedHandler

    /** @type {?TokenData} */
    #token
    /** @type {number} local authed at in milliseconds */
    #tokenAuthAt = 0
    #validateTried = false

    /** @type {?string[]}  Auth fields */
    #fields

    enableCookie = true

    initUnauthorizedHandler(handler) {
        this.#unauthorizedHandler = handler
        return this
    }

    /**
     * @param {AaStorageFactor} storage
     * @param {AaRawFetch} rawFetch
     */
    constructor(storage, rawFetch) {
        this.#storage = storage
        this.#rawFetch = rawFetch
        setTimeout(() => {
            this.validate()
        }, 400 * time.Millisecond)
    }


    /**
     * Check whether is in logged in status
     * @param {(token:{TokenData})=>void} [callback] callback when re-logged in with refresh token
     * @return {boolean}
     * @warn 这个能提前返回一个缓存中的登录状态，不过这个不够准确！因此通过callback来更新登录状态。
     */
    authed(callback) {
        const token = this.#getCachedToken()
        const authed = token && token.isValid()
        if (!authed && typeof callback === "function") {
            this.getToken().then(token => {
                callback(token)
            }, nif)
        }
        return authed
    }

    /**
     * Clear all auth data
     * @note 非手动退出，就不要清空所有数据，避免用户缓存的文章丢失
     */
    clear() {
        this.#storage.removeEntire(/^aa:auth:/)
        this.#tryDeleteCookie('access_token')
        this.#tryDeleteCookie('token_type')
        this.#token = null // clear program cache
    }

    clearExceptAuth() {
        this.#storage.clearAllExcept([/^aa:auth:/, "access_token", "token_type"])
    }


    /**
     * Get authorization value in header
     * @return {Promise<string>}
     */
    getAuthorization() {
        return this.getToken().then(token => {
            return this.#formatAuthorization(token)
        })
    }

    getFields() {
        return this.readStorage("fields")
    }

    /**
     * Get token data
     * @param noRefresh
     * @return {Promise<?TokenData>}
     */
    getToken(noRefresh = false) {
        let token = this.#getCachedToken()
        if (!token || (!token.isValid() && (noRefresh || !token['refresh_token']))) {
            return APromiseReject(AaAuth.NoTokenError)
        }
        return token.isValid() ? APromiseResolve(token) : this.refresh()
    }

    /**
     * Log out
     * @param {function} [callback]
     * @note 所有401，都执行一次服务端退出，这样可以排除大量异常情况 ——— 影响用户下单的成本是最重的！！
     */
    logout(callback) {
        // 手动退出，才会清空所有数据
        this.#storage.clearAll()
        this.#token = null // clear program cache
        this.#tryStoreCookie(aparam.Logout, 1, 5 * time.Minute)
        callback && callback()
    }

    /**
     * Prepare checking login status before doing something
     */
    prepare() {
        this.getToken().catch(() => {
            this.triggerUnauthorized()
        })
    }

    readStorage(key) {
        let value = this.#storage.cookie.getItem(key)
        if (value) {
            return value
        }
        value = this.#sessionGetItem(key)
        if (value) {
            return value
        }

        return this.#localGetItem(key)
    }

    /**
     * Refresh access token, and return new token data
     * @return {Promise<?TokenData>|*}
     */
    refresh() {
        const token = this.#getCachedToken()
        if (!token || !token['refresh_api'] || !token['refresh_token']) {
            return APromiseReject(`unable to refresh access token`)
        }
        if (token.isValid()) {
            return APromiseResolve(token)
        }
        if (this.tx.xlock()) {
            return asleep(300 * time.Millisecond).then(() => {
                return this.refresh()
            })
        }
        const refreshToken = token['refresh_token']
        const url = token['refresh_api']
        return this.#rawFetch.fetch(url, {
            mustAuth           : false,
            preventTokenRefresh: true,
            data               : {
                'grant_type': 'refresh_token',
                'code'      : refreshToken,
            }
        }).then(data => {
            const ok = this.setToken(data)
            if (!ok) {
                throw new TypeError(`save token failed`)
            }
            this.#validateTried = true
            this.#sessionSetItem('checked', true)
            return this.#token
        }).catch(err => {
            err = aerror(err)
            if (!err.isServerErrors()) {
                this.clear()
            }
            err.log()
            throw err
        }).finally(() => {
            this.tx.unlock()
        })
    }


    removeLogout() {
        this.#tryStoreCookie(aparam.Logout, 0, -time.Day)
    }


    /**
     * Set token and fields
     * @param token
     * @param [fields]
     * @return {boolean}
     */
    setToken(token, fields) {
        this.removeLogout()
        this.#tokenAuthAt = Date.now()

        token = this.#validateToken(token)
        if (!token || !token.isValid()) {
            log.error(`auth: set invalid token`, token)
            return false
        }

        if (bool(token, "conflict")) {
            alert("授权登录绑定过其他账号，已切换至授权登录的账号。")
        }

        this.#fields = fields
        this.#token = token

        // 清空其他缓存
        this.#storage.clearAll()

        let expires = token['expires_in'] * time.Second
        this.#tryStoreCookie("access_token", token['access_token'], expires)
        this.#tryStoreCookie("token_type", token['token_type'], expires)

        // refresh token 不应该放到cookie里面，而且存储时间应该更久
        let rtokenExpires = token['refresh_ttl'] * time.Second
        // cookie 不能获取过期时间，所以存储一下
        this.#localSetItem("expires_in", token['expires_in'], rtokenExpires)
        this.#localSetItem("state", token['state'], rtokenExpires)
        this.#localSetItem("scope", token['scope'], rtokenExpires)
        // state 用于透传，不用存储；expires_in/ refresh_ttl 可以获取，不用存储
        this.#localSetItem("conflict", token['conflict'], rtokenExpires)
        this.#localSetItem("refresh_api", token['refresh_api'], rtokenExpires)
        this.#localSetItem("refresh_token", token['refresh_token'], rtokenExpires)
        this.#localSetItem("secure", token['secure'], rtokenExpires)
        this.#localSetItem("validate_api", token['validate_api'], rtokenExpires)

        this.#localSetItem("fields", fields, rtokenExpires)
        this.#sessionSetItem('checked', true)
        return true
    }


    /**
     * Trigger to handle Unauthorized
     * @param {any} msg
     * @return {boolean}
     */
    triggerUnauthorized(msg = '') {
        if (typeof this.#unauthorizedHandler !== "function") {
            return false
        }
        log.debug("trigger unauthorized", msg)
        this.clear()
        const result = this.#unauthorizedHandler()
        return typeof result === "boolean" ? result : true
    }


    /**
     * Validate the availability of local access token with remote api
     */
    validate() {
        this.getToken().then(token => {
            let checked = this.#sessionGetItem('checked')
            if (this.#validateTried || checked || !token || !token['validate_api']) {
                return
            }

            this.#validateTried = true  // fetch 可能失败，就有可能会一直尝试；因此增加一个程序层防重
            const url = token['validate_api']
            let authorization = this.#formatAuthorization(token)

            if (this.tx.xlock()) {
                setTimeout(() => {
                    this.validate()
                }, 300 * time.Millisecond)
                return
            }
            this.#rawFetch.fetch(url, {
                headers: {
                    'Authorization': authorization,
                }
            }).then(_ => {
                this.#sessionSetItem('checked', true)
            }).catch(err => {
                if (err instanceof AError && !err.isServerErrors()) {
                    this.clear()
                }
                log.warn(err.toString())
            }).finally(() => {
                this.tx.unlock()
            })
        }, nif)
    }


    #cookieOptions(expires) {
        let domain = this.cookieDomainHandler ? this.cookieDomainHandler() : false
        return {
            domain : domain,
            path   : '/',
            expires: expires ? expires : 0, // Lax 允许部分第三方跳转过来时请求携带Cookie；Strict 仅允许同站请求携带cookie
            // 微信授权登录，跳转回来。如果是strict，就不会携带cookie（防止csrf攻击）；而lax就会携带。
            // 在 Lax 模式下只会阻止在使用危险 HTTP 方法进行请求携带的三方 Cookie，例如 POST 方式。同时，使用 Js 脚本发起的请求也无法携带三方 Cookie。
            // 谷歌默认 sameSite=Lax
            sameSite: 'lax',
            secure  : location.protocol === "https"  // 只允许https访问
        }
    }

    /**
     * Format authorization header value
     * @param {?TokenData} token
     * @return {string}
     */
    #formatAuthorization(token) {
        if (!token || !token['access_token'] || !token['token_type']) {
            return ""
        }
        return token['token_type'] + " " + token['access_token']
    }

    #getCachedToken() {
        // 由于access token经常使用，并且可能会由于第三方登录，导致修改cookie。
        // 因此，查询变量方式效率更高，且改动相对无时差
        let token = this.#token
        if (token) {
            return token
        }
        const r = this.#localGetTTL("refresh_token", time.Second)
        token = this.#validateToken({
            "access_token": this.readStorage("access_token"),
            "expires_in"  : this.readStorage("expires_in"),
            "scope"       : this.readStorage("scope"),
            "state"       : this.readStorage("state"),
            "token_type"  : this.readStorage("token_type"),

            "conflict"     : this.readStorage("conflict"),
            "refresh_api"  : this.readStorage("refresh_api"),
            "refresh_token": r.value,
            "refresh_ttl"  : r.ttl,
            "secure"       : this.readStorage("secure"),
            "validate_api" : this.readStorage("validate_api"),
        })
        this.#token = token // 避免改动

        return token
    }

    #getTokenAuthAt() {
        if (this.#tokenAuthAt) {
            return this.#tokenAuthAt
        }
        const now = Date.now()
        const {value, ttl} = this.#storage.local.getTTL("expires_in", time.Millisecond)
        if (!ttl || !value) {
            this.#tokenAuthAt = now
        } else {
            this.#tokenAuthAt = now - (value * time.Second) + ttl
        }
        return this.#tokenAuthAt
    }

    #localGetItem(key) {
        return AaAuth.#readItem(this.#storage.local, key)
    }

    #localGetTTL(key, unit) {
        const engine = this.#storage.local
        const keyname = AaAuth.#storageKeyName(engine, key)
        return engine.getTTL(keyname, unit)


    }

    #localRemoveItem(key) {
        return AaAuth.#removeItem(this.#storage.local, key)
    }

    #localSetItem(key, value, expiresIn) {
        return AaAuth.#saveItem(this.#storage.local, key, value, {expires: expiresIn})
    }

    #sessionGetItem(key) {
        return AaAuth.#readItem(this.#storage.session, key)
    }

    #sessionSetItem(key, value) {
        return AaAuth.#saveItem(this.#storage.session, key, value)
    }


    #tryDeleteCookie(key) {
        this.#localRemoveItem(key)
        this.#storage.cookie.removeItem(key, this.#cookieOptions(-time.Day))
    }


    #tryStoreCookie(key, value, expires) {
        if (!this.enableCookie) {
            this.#localSetItem(key, value)
            return
        }
        this.#storage.cookie.setItem(key, value, this.#cookieOptions(expires))
    }


    /**
     * @param token
     * @return {?{access_token:string, refresh_token: string, refresh_api: string, validate_api: string, scope: ?struct, isValid: ()=> boolean, state: string, token_type, refresh_ttl: number, secure: (void|boolean), expires_in: number, conflict: (void|boolean)}}
     * @note 有可能access_token已过期，而refresh_token还未过期，因此需要 .isValid()判断
     */
    #validateToken(token) {
        const isAccessTokenInvalid = !token['access_token'] || !token['token_type']
        const isRefreshTokenInvalid = !token['refresh_api'] || !token['refresh_token']
        // access_token 可能过期清除了；此时可以通过 refresh token 更新
        if (isAccessTokenInvalid && isRefreshTokenInvalid) {
            return null
        }
        const itself = this
        let expiresIn = int32(token, 'expires_in', 2 * time.Hour)
        let rtokenTTL = int32(token, 'refresh_ttl', 7 * time.Day)
        return {
            // 标准参数
            "access_token": token["access_token"],
            "expires_in"  : expiresIn,
            "scope"       : token.hasOwnProperty('scope') ? token["secure"] : null,
            "state"       : string(token, "state"),
            "token_type"  : token["token_type"],

            // 非标准参数
            "conflict"     : typeof token['conflict'] === 'undefined' ? void false : bool(token["conflict"]),
            "refresh_api"  : string(token, "refresh_api"),  // 非必要
            "refresh_token": string(token, "refresh_token"),// 非必要
            "refresh_ttl"  : rtokenTTL,// 非必要
            "secure"       : typeof token["secure"] === 'undefined' ? void false : bool(token["secure"]),
            "validate_api" : string(token, "validate_api"),// 非必要
            isValid        : function () {
                const expires = this['expires_in'] * time.Second + itself.#getTokenAuthAt()
                return expires > Date.now()
            },
        }
    }

    /**
     *
     * @param {AaStorageEngine} engine
     * @param {string} key
     * @param {any} value
     * @param {StorageOptions} [options]
     * @return {void|*}
     */
    static #saveItem(engine, key, value, options) {
        const keyname = AaAuth.#storageKeyName(engine, key)
        return engine.setItem(...fmt.args(keyname, value, options))
    }

    /**
     *
     * @param engine
     * @param key
     * @return {string}
     * @warn  如果使用 #keyname() / #keyName() 命名，编译便会报错
     */
    static #storageKeyName(engine, key) {
        return ['aa', 'auth', key].join(engine.separator)
    }


    static #readItem(engine, key) {
        const keyname = AaAuth.#storageKeyName(engine, key)
        return engine.getItem(keyname)
    }

    static #removeItem(engine, key) {
        const keyname = AaAuth.#storageKeyName(engine, key)
        return engine.removeItem(keyname)
    }

}