// @import aparam, _aaStorageFactor, _aaRawFetch


class _aaAuth {
    name = 'aa-auth'

    // @type _aaStorageFactor
    #storage
    // @type _aaRawFetch
    #rawFetch

    // @type function  外部可以使用、修改
    #unauthorizedHandler

    // @type {{access_token: string, conflict: boolean|undefined, expires_in: number, refresh_api: string, refresh_token: string, scope: null, secure: boolean|undefined, token_type: string, validate_api: string}}
    #_token
    #tokenAuthAt = 0

    // aa.auth.token['access_token']
    get token() {
        let now = Math.floor(new Date().getTime() / 1000)
        // 由于access token经常使用，并且可能会由于第三方登录，导致修改cookie。
        // 因此，查询变量方式效率更高，且改动相对无时差
        const r = this.#storage
        if (!this.#_token) {
            const accessToken = r.getEntire("aa:auth.access_token")
            if (!accessToken) {
                return null
            }
            this.#_token = {
                "access_token" : accessToken,
                "conflict"     : r.getEntire("aa:auth.conflict"),
                "expires_in"   : r.getEntire("aa:auth.expires_in"),
                "refresh_api"  : r.getEntire("aa:auth.refresh_api"),
                "refresh_token": r.getEntire("aa:auth.refresh_token"),
                "scope"        : r.getEntire("aa:auth.scope"),
                "secure"       : r.getEntire("aa:auth.secure"),
                "token_type"   : r.getEntire("aa:auth.token_type"),
                "validate_api" : r.getEntire("aa:auth.validate_api"),
            }
            this.#tokenAuthAt = r.getEntire("aa:auth._localAuthAt")
        }


        const exp = this.#_token['expires_in'] + this.#tokenAuthAt - now
        if (exp <= 0) {
            return this.refresh()
        }
        return this.#_token
    }

    set token(token) {
        this.setToken(token)
    }

    initUnauthorizedHandler(handler) {
        this.#unauthorizedHandler = handler
        return this
    }

    /**
     * @param {_aaStorageFactor} storage
     * @param {_aaRawFetch} rawFetch
     */
    constructor(storage, rawFetch) {
        this.#storage = storage
        this.#rawFetch = rawFetch
        setTimeout(() => {
            this.validate()
        }, 400 * time.Millisecond)
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
        let checked = bool(this.#storage.session.getItem('aa:auth.checked'))
        if (checked || !this.token || !this.token['validate_api']) {
            return
        }
        const [method, api] = this.#parseApiUrl(this.token['validate_api'])
        this.#rawFetch.fetch(api, {
            method: method,
            data  : {}
        }).then(_ => {
            this.#storage.session.setItem('aa:auth.checked', true)
        }).catch(err => {
            if (err.isGone()) {
                this.clear()
            }
            log.warn(err.toString())
        })
    }

    #tryStoreCookie(key, value, expiresInMilliseconds = 7 * time.Day) {
        if (this.#storage.cookie.isPseudo()) {
            this.#storage.local.setItem(key, value)
            return
        }


        // sameSite: Lax 仅支持GET表单、链接发送第三方站点cookie，POST/Ajax/Image等就不支持
        //  strict 跨站点时候，完全禁止第三方 Cookie，跨站点时，任何情况下都不会发送 Cookie。换言之，只有当前网页的 URL 与请求目标一致，才会带上 Cookie。
        // domain: .luexu.com  会让所有子站点，如 cns.luexu.com 也同时能获取到
        // domain 前面必须要带上 .
        let domain = window.location.hostname.replace(/.*\.(\w+\.com)/ig, '$1')
        const cf = {
            domain : domain,
            path   : '/',
            expires: new Date() + expiresInMilliseconds, // Lax 允许部分第三方跳转过来时请求携带Cookie；Strict 仅允许同站请求携带cookie
            // 微信授权登录，跳转回来。如果是strict，就不会携带cookie（防止csrf攻击）；而lax就会携带。
            // 在 Lax 模式下只会阻止在使用危险 HTTP 方法进行请求携带的三方 Cookie，例如 POST 方式。同时，使用 Js 脚本发起的请求也无法携带三方 Cookie。
            // 谷歌默认 sameSite=Lax
            sameSite: 'lax',
            secure  : location.protocol === "https",  // 只允许https访问
        }

        /*
   在服务器端设置cookie的HttpOnly属性为true。这将防止JavaScript修改cookie，因为在HttpOnly模式下，cookie只能通过HTTP协议访问，无法通过JavaScript或其它客户端脚本来修改。
        */
        // 由于cookie可以跨域，而 localStorage 不能跨域。
        // 单点登录，所以这些信息都用 cookie 来保存

        this.#storage.cookie.setItem(key, value, cf)

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

    setToken(token) {
        token = this.validateToken(token)
        if (!token) {
            alert("set invalid token")
            return
        }

        if (bool(token, "conflict")) {
            alert("授权登录绑定过其他账号，已切换至授权登录的账号。")
        }

        this.#_token = {
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
        this.#tokenAuthAt = Math.floor(new Date().getTime() / 1000)

        // 清空其他缓存
        this.#storage.clearAll()

        const expiresIn = this.#_token['expires_in']
        this.#tryStoreCookie("aa:auth.access_token", this.#_token['access_token'], expiresIn * time.Second)
        this.#tryStoreCookie("aa:auth.token_type", this.#_token['token_type'], expiresIn * time.Second)

        // refresh token 不应该放到cookie里面
        this.#storage.local.setItem("aa:auth.conflict", this.#_token['conflict'])
        this.#storage.local.setItem("aa:auth.expires_in", expiresIn, expiresIn * time.Second)
        this.#storage.local.setItem("aa:auth.refresh_api", this.#_token['refresh_api'])
        this.#storage.local.setItem("aa:auth.refresh_token", this.#_token['refresh_token'])
        this.#storage.local.setItem("aa:auth.scope", this.#_token['scope'])
        this.#storage.local.setItem("aa:auth.secure", this.#_token['secure'])
        this.#storage.local.setItem("aa:auth.validate_api", this.#_token['validate_api'], expiresIn * time.Second)

        this.#storage.local.setItem("aa:auth._localAuthAt", this.#tokenAuthAt)
        this.#storage.session.setItem('aa:auth.checked', true)
    }

    refresh() {
        const token = this.token
        if (!token || !token['refresh_api'] || !token['refresh_token']) {
            return null
        }
        const refreshToken = token['refresh_token']
        const [method, api] = this.#parseApiUrl(token['refresh_api'])
        this.#rawFetch.fetch(api, {
            auth               : true,
            preventTokenRefresh: true,
            method             : method,
            data               : {
                'grant_type': 'refresh_token',
                'code'      : refreshToken,
            }
        }).then(data => {
            this.setToken(data)
        }).catch(err => {
            log.error(err.toString())
        })
    }

    clear() {
        this.#storage.removeEntire(/^aa:auth\./)
    }

    /**
     * Get authorization value in header
     * @return {string}
     */
    getAuthorization() {
        if (!this.token || !this.token['access_token'] || !this.token['token_type']) {
            return ""
        }
        return this.token['token_type'] + " " + this.token['access_token']
    }


    /**
     *  Check is  in logged in status
     * @return {boolean}
     */
    authed() {
        return len(this.token, 'access_token') > 0 && len(this.token, 'token_type') > 0
    }

    // 所有401，都执行一次服务端退出，这样可以排除大量异常情况 ——— 影响用户下单的成本是最重的！！
    logout(callback) {
        this.#storage.clearAllExcept([aparam.Logout])
        this.#_token = null // clear program cache
        this.#tryStoreCookie(aparam.Logout, 1, 5 * time.Minute)
        callback()
    }

    #parseApiUrl(s) {
        let [method, api] = string(s).split(' ')  // GET xxxx
        if (!api) {
            api = method
            method = 'GET'
        }
        return [method, api]
    }

}