/**
 * @import aparam, AaStorageFactor, AaRawFetch
 * @typedef {{access_token: string, conflict: boolean|undefined, expires_in: number, refresh_api: string, refresh_token: string, scope: null, secure: boolean|undefined, token_type: string, validate_api: string}} TokenData
 */


class AaAuth {
    name = 'aa-auth'

    // @type {AaStorageFactor}
    #storage

    // @type {AaRawFetch}
    #rawFetch

    // @type {function}  外部可以使用、修改
    #unauthorizedHandler

    // @type {TokenData}
    #token
    #tokenAuthAt = 0
    #validateTried = false

    // @type {string[]|null}  Auth fields
    #fields

    enableCookie = true
    cookieOptions = {
        // domain : ,
        path   : '/',
        expires: Date.now() + 7 * time.Day, // Lax 允许部分第三方跳转过来时请求携带Cookie；Strict 仅允许同站请求携带cookie
        // 微信授权登录，跳转回来。如果是strict，就不会携带cookie（防止csrf攻击）；而lax就会携带。
        // 在 Lax 模式下只会阻止在使用危险 HTTP 方法进行请求携带的三方 Cookie，例如 POST 方式。同时，使用 Js 脚本发起的请求也无法携带三方 Cookie。
        // 谷歌默认 sameSite=Lax
        sameSite: 'lax', //secure  : location.protocol === "https",  // 只允许https访问
    }


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
     *
     * @param engine
     * @param key
     * @return {string}
     * @warn  如果使用 #keyname() / #keyName() 命名，编译便会报错
     */
    static #storageKeyName(engine, key) {
        return ['aa', 'auth', key].join(engine.separator)
    }

    static #saveItem(engine, key, value) {
        const keyname = AaAuth.#storageKeyName(engine, key)
        return engine.setItem(keyname, value)
    }

    static #readItem(engine, key) {
        const keyname = AaAuth.#storageKeyName(engine, key)
        return engine.getItem(keyname)
    }

    #readStorage(key) {
        const r = this.#storage
        let value = r.cookie.getItem(key)
        if (value) {
            return value
        }
        value = this.#sessionGetItem(key)
        if (value) {
            return value
        }
        return this.#localGetItem(key)
    }

    #localSetItem(key, value) {
        return AaAuth.#saveItem(this.#storage.local, key, value)
    }

    #localGetItem(key) {
        return AaAuth.#readItem(this.#storage.local, key)
    }

    #sessionSetItem(key, value) {
        return AaAuth.#saveItem(this.#storage.session, key, value)
    }

    #sessionGetItem(key) {
        return AaAuth.#readItem(this.#storage.session, key)
    }

    #tryStoreCookie(key, value, opts) {
        if (!this.enableCookie) {
            this.#localSetItem(key, value)
            return
        }


        // sameSite: Lax 仅支持GET表单、链接发送第三方站点cookie，POST/Ajax/Image等就不支持
        //  strict 跨站点时候，完全禁止第三方 Cookie，跨站点时，任何情况下都不会发送 Cookie。换言之，只有当前网页的 URL 与请求目标一致，才会带上 Cookie。
        // domain: .luexu.com  会让所有子站点，如 cns.luexu.com 也同时能获取到
        // domain 前面必须要带上 .

        /*
   在服务器端设置cookie的HttpOnly属性为true。这将防止JavaScript修改cookie，因为在HttpOnly模式下，cookie只能通过HTTP协议访问，无法通过JavaScript或其它客户端脚本来修改。
        */
        // 由于cookie可以跨域，而 localStorage 不能跨域。
        // 单点登录，所以这些信息都用 cookie 来保存
        if (typeof opts === "number") {
            opts = {
                expires: opts,
            }
        }
        opts = map.fillUp(opts, this.cookieOptions)
        const hostname = window.location.hostname
        opts.domain = /^([\d.]+|[^.]+)$/.test(hostname) ? hostname : hostname.replace(/^[^.]+/ig, '')
        opts.secure = location.protocol === "https"  // 只允许https访问
        this.#storage.cookie.setItem(key, value, opts)


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
        const result = this.#unauthorizedHandler()
        return typeof result === "boolean" ? result : true
    }

    /**
     * Prepare checking login status before doing something
     */
    prepare() {
        if (this.authed()) {
            return
        }
        this.triggerUnauthorized()
    }

    /**
     * Validate the availability of local access token with remote api
     */
    validate() {
        let checked = this.#sessionGetItem('checked')
        const token = this.getToken()
        if (this.#validateTried || checked || !token || !token['validate_api']) {
            return
        }
        this.#validateTried = true  // fetch 可能失败，就有可能会一直尝试；因此增加一个程序层防重
        const url = token['validate_api']
        this.#rawFetch.fetch(url, {
            mustAuth: false,
        }).then(_ => {
            this.#sessionSetItem('checked', true)
        }).catch(err => {
            if (!err.isServerErrors()) {
                this.clear()
            }
            log.warn(err.toString())
        })
    }


    validateToken(token) {
        if (!token['access_token'] || !token['expires_in'] || !token['token_type']) {
            return null
        }
        const expiresIn = intMax(token['expires_in'])  // expires in seconds
        if (expiresIn * time.Second < 3 * time.Minute) {
            return null
        }
        return {
            "access_token" : token["access_token"],
            "conflict"     : token.hasOwnProperty('conflict') ? bool(token["conflict"]) : void false,
            "expires_in"   : expiresIn,
            "refresh_api"  : string(token, "refresh_api"),  // 非必要
            "refresh_token": string(token, "refresh_token"),
            "scope"        : token.hasOwnProperty('scope') ? token["secure"] : null,
            "secure"       : token.hasOwnProperty('secure') ? bool(token["secure"]) : void false,
            "token_type"   : token["token_type"],
            "validate_api" : string(token, "validate_api"),
        }
    }

    getFields() {
        return this.#readStorage("fields")
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

        token = this.validateToken(token)
        if (!token) {
            alert("set invalid token")
            return
        }

        if (bool(token, "conflict")) {
            alert("授权登录绑定过其他账号，已切换至授权登录的账号。")
        }

        this.#token = {
            "access_token" : token["access_token"],
            "conflict"     : bool(token['conflict']),
            "expires_in"   : intMax(token["expires_in"]),
            "refresh_api"  : token["refresh_api"],
            "refresh_token": token["refresh_token"],
            "scope"        : token["scope"],
            "secure"       : bool(token["secure"]),
            "token_type"   : token["token_type"],
            "validate_api" : token["validate_api"],

        }
        this.#tokenAuthAt = Math.floor(new Date().valueOf() / 1000)

        // 清空其他缓存
        this.#storage.clearAll()

        const expiresIn = this.#token['expires_in']
        this.#tryStoreCookie("access_token", this.#token['access_token'], expiresIn * time.Second)
        this.#tryStoreCookie("token_type", this.#token['token_type'], expiresIn * time.Second)

        // refresh token 不应该放到cookie里面
        this.#localSetItem("conflict", this.#token['conflict'])
        this.#localSetItem("expires_in", expiresIn)
        this.#localSetItem("refresh_api", this.#token['refresh_api'])
        this.#localSetItem("refresh_token", this.#token['refresh_token'])
        this.#localSetItem("scope", this.#token['scope'])
        this.#localSetItem("secure", this.#token['secure'])
        this.#localSetItem("validate_api", this.#token['validate_api'])

        this.#localSetItem("localAuthAt_", this.#tokenAuthAt)
        this.#sessionSetItem('checked', true)

        this.setFields(fields)
    }


    getToken(noRefresh = false) {
        // 由于access token经常使用，并且可能会由于第三方登录，导致修改cookie。
        // 因此，查询变量方式效率更高，且改动相对无时差
        let token = this.#token
        if (!token) {
            const accessToken = this.#readStorage("access_token")

            if (!accessToken) {
                return null
            }
            token = {
                "access_token" : accessToken,
                "conflict"     : this.#readStorage("conflict"),
                "expires_in"   : this.#readStorage("expires_in"),
                "refresh_api"  : this.#readStorage("refresh_api"),
                "refresh_token": this.#readStorage("refresh_token"),
                "scope"        : this.#readStorage("scope"),
                "secure"       : this.#readStorage("secure"),
                "token_type"   : this.#readStorage("token_type"),
                "validate_api" : this.#readStorage("validate_api"),
            }
            this.#token = token
            this.#tokenAuthAt = this.#readStorage("localAuthAt_")
        }
        if (!noRefresh) {
            const exp = (token['expires_in'] + this.#tokenAuthAt) * time.Second - Date.now()
            if (exp <= 0) {
                return this.refresh()
            }

        }
        return this.#token
    }

    refresh() {
        const token = this.getToken(true)
        if (!token || !token['refresh_api'] || !token['refresh_token']) {
            return null
        }
        const refreshToken = token['refresh_token']
        const url = token['refresh_api']
        this.#rawFetch.fetch(url, {
            mustAuth           : false,
            preventTokenRefresh: true,
            data               : {
                'grant_type': 'refresh_token',
                'code'      : refreshToken,
            }
        }).then(data => {
            this.setToken(data)
        }).catch(err => {
            if (!err.isServerErrors()) {
                this.clear()
            }
            log.error(err.toString())
        })
    }


    /**
     * Get authorization value in header
     * @return {string}
     */
    getAuthorization() {
        const token = this.getToken()
        if (!token || !token['access_token'] || !token['token_type']) {
            return ""
        }
        return token['token_type'] + " " + token['access_token']
    }


    /**
     *  Check is  in logged in status
     * @return {boolean}
     */
    authed() {
        const token = this.getToken()
        return len(token, 'access_token') > 0 && len(token, 'token_type') > 0
    }


    /**
     * Clear all auth data
     * @note 非手动退出，就不要清空所有数据，避免用户缓存的文章丢失
     */
    clear() {
        this.#storage.removeEntire(/^aa:auth:\./)
        this.#token = null // clear program cache
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

    removeLogout() {
        this.#tryStoreCookie(aparam.Logout, 0, -time.Day)
    }
}