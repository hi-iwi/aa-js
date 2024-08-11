/**
 * @import aparam, AaStorageFactor, AaRawFetch
 * @typedef {{access_token: string, conflict: boolean|undefined, expires_in: number, refresh_api: string, refresh_token: string, scope: null, secure: boolean|undefined, token_type: string, validate_api: string}} TokenData
 */


class AaAuth {
    name = 'aa-auth'

    static NoTokenError = new AError(AErrorEnum.Unauthorized, 'no token')

    lock = new AaLock()
    /** @type {AaStorageFactor}   不要设为私有，要不外面使用会 attempted to get private field on non-instance */
    #storage

    /** @type {AaRawFetch} */
    #rawFetch

    /** @type {function}  外部可以使用、修改 */
    #unauthorizedHandler

    /** @type {TokenData|null} */
    #token
    /** @type number local authed at in seconds*/
    #tokenAuthAt = 0
    #validateTried = false

    /** @type {string[]|null}  Auth fields */
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
     * @return {Promise<TokenData|null>}
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
     * @return {Promise<TokenData|null>|*}
     */
    refresh() {
        const token = this.#getCachedToken()
        if (!token || !token['refresh_api'] || !token['refresh_token']) {
            return APromiseReject(`unable to refresh access token`)
        }
        if (token.isValid()) {
            return APromiseResolve(token)
        }
        if (!this.lock.lock()) {
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
            this.setToken(data)
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
            this.lock.unlock()
        })
    }


    removeLogout() {
        this.#tryStoreCookie(aparam.Logout, 0, -time.Day)
    }

    setFields(fields) {
        this.#fields = fields
        this.#localSetItem("fields", fields)
    }

    /**
     * Set token and fields
     * @param token
     * @param fields
     */
    setToken(token, fields) {
        this.removeLogout()
        this.#tokenAuthAt = Math.floor(new Date().valueOf() / time.Second)

        token = this.#validateToken(token)
        if (!token || !token.isValid()) {
            console.error(`auth: set invalid token`, token)
            return
        }

        if (bool(token, "conflict")) {
            alert("授权登录绑定过其他账号，已切换至授权登录的账号。")
        }


        this.#token = token

        // 清空其他缓存
        this.#storage.clearAll()

        const expiresIn = token['expires_in']
        this.#tryStoreCookie("access_token", token['access_token'], expiresIn * time.Second)
        this.#tryStoreCookie("token_type", token['token_type'], expiresIn * time.Second)


        // refresh token 不应该放到cookie里面
        this.#localSetItem("conflict", token['conflict'])
        this.#localSetItem("expires_in", expiresIn)
        this.#localSetItem("refresh_api", token['refresh_api'])
        this.#localSetItem("refresh_token", token['refresh_token'])
        this.#localSetItem("scope", token['scope'])
        this.#localSetItem("secure", token['secure'])
        this.#localSetItem("validate_api", token['validate_api'])

        this.#localSetItem("localAuthAt_", this.#tokenAuthAt)
        this.#sessionSetItem('checked', true)

        this.setFields(fields)
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

            if (!this.lock.lock()) {
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
                this.lock.unlock()
            })
        }, nif)
    }


    #cookieOptions(expires) {
        const hostname = window.location.hostname
        const domain = /^([\d.]+|[^.]+)$/.test(hostname) ? hostname : hostname.replace(/^[^.]+/ig, '')
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
     * @param {TokenData|null} token
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
        this.#tokenAuthAt = this.readStorage("localAuthAt_")

        token = this.#validateToken({
            "access_token" : this.readStorage("access_token"),
            "conflict"     : this.readStorage("conflict"),
            "expires_in"   : this.readStorage("expires_in"),
            "refresh_api"  : this.readStorage("refresh_api"),
            "refresh_token": this.readStorage("refresh_token"),
            "scope"        : this.readStorage("scope"),
            "secure"       : this.readStorage("secure"),
            "token_type"   : this.readStorage("token_type"),
            "validate_api" : this.readStorage("validate_api"),
        })
        this.#token = token // 避免改动
        return token
    }

    #localGetItem(key) {
        return AaAuth.#readItem(this.#storage.local, key)
    }

    #localRemoveItem(key) {
        return AaAuth.#removeItem(this.#storage.local, key)
    }

    #localSetItem(key, value) {
        return AaAuth.#saveItem(this.#storage.local, key, value)
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


    #validateToken(token) {
        const isAccessTokenInvalid = !token['access_token'] || !token['expires_in'] || !token['token_type']
        const isRefreshTokenInvalid = !token['refresh_api'] || !token['refresh_token']

        // access_token 可能过期清除了；此时可以通过 refresh token 更新
        if (isAccessTokenInvalid && isRefreshTokenInvalid) {
            return null
        }
        const itself = this
        return {
            "access_token" : token["access_token"],
            "conflict"     : token.hasOwnProperty('conflict') ? bool(token["conflict"]) : void false,
            "expires_in"   : intMax(token['expires_in']),
            "refresh_api"  : string(token, "refresh_api"),  // 非必要
            "refresh_token": string(token, "refresh_token"),// 非必要
            "scope"        : token.hasOwnProperty('scope') ? token["secure"] : null,
            "secure"       : token.hasOwnProperty('secure') ? bool(token["secure"]) : void false,
            "token_type"   : token["token_type"],
            "validate_api" : string(token, "validate_api"),// 非必要
            isValid        : function () {
                if (!this['access_token'] || !this['expires_in'] || !this['token_type']) {
                    return false
                }
                const expires = (itself.#tokenAuthAt + this['expires_in']) * time.Second
                return expires > Date.now()
            },
        }
    }

    static #saveItem(engine, key, value) {
        const keyname = AaAuth.#storageKeyName(engine, key)
        return engine.setItem(keyname, value)
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