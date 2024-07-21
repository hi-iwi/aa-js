// @import aparam, _aaStorageFactor


class _aaAuth {


    // @type _aaStorageFactor
    #storage
    // @type {{access_token: string, refresh_token: string, _localAuthAt: number, scope: null, admin: number, token_type: string, expires_in: number, conflict: boolean}}
    #token = {
        "access_token": "",
        // "admin"        : 0,
        // "conflict"     : false,
        "expires_in": 0,

        "token_type"   : "",
        "refresh_token": "",
        "scope"        : null,
        _localAuthAt   : 0,
    }

    // aa.auth.token['access_token']
    get token() {
        let now = Math.floor(new Date().getTime() / 1000)
        // 由于access token经常使用，并且可能会由于第三方登录，导致修改cookie。
        // 因此，查询变量方式效率更高，且改动相对无时差
        const r = this.#storage
        if (!this.#token) {
            const accessToken = r.getItem("access_token")
            if (!accessToken) {
                return null
            }
            this.#token = {
                "access_token": accessToken,
                // "admin"        : 0,
                // "conflict"     : false,
                "expires_in": int32(r.getItem("expires_in")),

                "token_type"   : r.getItem("token_type"),
                "refresh_token": r.getItem("refresh_token"),
                "scope"        : r.getItem("scope"),
                "_localAuthAt" : intMax(r.getItem("_localAuthAt")),
            }
        }


        const exp = this.#token['expires_in'] + this.#token._localAuthAt - now
        if (exp <= 0) {
            return this.refresh()
        }
        return this.#token
    }

    set token(token) {
        this.setToken(token)
    }


    // AccessTokenType     : "token_type",
    // AccessToken         : "access_token",  // header/query/cookie
    // AccessTokenExpiresIn: "expires_in",
    // AccessTokenConflict : "conflict",
    // RefreshToken        : "refresh_token",
    // Scope               : "scope",
    // ScopeAdmin          : "admin",
    //
    // LocalAuthAt: "_localAuthAt",
    constructor(storage) {
        this.#storage = storage
    }

    #storeTokenInCookie(accessToken, tokenType, expiresIn) {

        // sameSite: Lax 仅支持GET表单、链接发送第三方站点cookie，POST/Ajax/Image等就不支持
        //  strict 跨站点时候，完全禁止第三方 Cookie，跨站点时，任何情况下都不会发送 Cookie。换言之，只有当前网页的 URL 与请求目标一致，才会带上 Cookie。
        // 7 天
        // domain: .luexu.com  会让所有子站点，如 cns.luexu.com 也同时能获取到
        // domain 前面必须要带上 .
        let domain = window.location.hostname.replace(/.*\.(\w+\.com)/ig, '$1')
        const cf = {
            domain : domain,
            path   : '/',
            expires: new Date((now + expiresIn) * 1000),
            // Lax 允许部分第三方跳转过来时请求携带Cookie；Strict 仅允许同站请求携带cookie
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
        this.#storage.cookie.setItem("aa:auth.access_token", accessToken, cf)
        this.#storage.cookie.setItem("aa:auth.token_type", tokenType, cf)
        this.#storage.cookie.setItem("aa:auth.expires_in", expiresIn, cf)
    }

    #storeTokenInLocal(accessToken, tokenType, expiresIn) {
        this.#storage.local.setItem("aa:auth.access_token", accessToken)
        this.#storage.local.setItem("aa:auth.token_type", tokenType)
        this.#storage.local.setItem("aa:auth.expires_in", expiresIn)
    }

    setToken(token) {
        if (!token['access_token']) {
            alert("set invalid token")
            return
        }

        if (bool(token, "conflict")) {
            alert("授权登录绑定过其他账号，已切换至授权登录的账号。")
        }

        let now = Math.floor(new Date().getTime() / 1000)

        this.#token = {
            "access_token": token["access_token"],
            // "admin"        : 0,
            // "conflict"     : false,
            "expires_in": token["expires_in"],

            "token_type"   : token["token_type"],
            "refresh_token": token["refresh_token"],
            "scope"        : token["scope"],
            _localAuthAt   : now,
        }

        // 清空其他缓存
        this.#storage.clearAll()

        // refresh token 不应该放到cookie里面
        this.#storage.local.setItem("aa:auth.refresh_token", token['refresh_token'])
        this.#storage.local.setItem("aa:auth.scope", token['scope'])
        this.#storage.local.setItem("aa:auth._localAuthAt", token._localAuthAt)

        const accessToken = this.#token['access_token']
        const tokenType = this.#token['token_type']
        const expiresIn = this.#token['expires_in']


        if (this.#storage.cookie.isPseudo()) {
            this.#storeTokenInLocal(accessToken, tokenType, expiresIn)
        } else {
            this.#storeTokenInCookie(accessToken, tokenType, expiresIn)
        }

        this.#storage.session.setItem('aa:auth.checked', 1)
    }

    refresh() {

    }

    clear() {
        this.#storage.removeAll("aa:auth.access_token")
        this.#storage.removeAll("aa:auth.expires_in")
        this.#storage.removeAll("aa:auth.token_type")
        this.#storage.removeAll("aa:auth.refresh_token")
        this.#storage.removeAll("aa:auth.scope")
        this.#storage.removeAll("aa:auth._localAuthAt")
        this.#storage.removeAll("aa:auth.checked")
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
}