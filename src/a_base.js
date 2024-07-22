const aparam = {
    Debug : "_debug", // 0 o debug; 1/true debug via console; 2/alert debug via alert
    Apollo: "apollo",


    Authorization :"Authorization",

    AccessTokenType     : "token_type",
    AccessToken         : "access_token",  // header/query/cookie
    AccessTokenExpiresIn: "expires_in",
    AccessTokenConflict : "conflict",
    RefreshToken        : "refresh_token",
    Scope               : "scope",
    ScopeAdmin          : "admin",

    LocalAuthAt    : "_localAuthAt",
    Logout         : "logout",
    PersistentNames: ["_debug", "apollo", "logout"],
}


// 为了方便 log 类，debug状态一律用全局
var _aaDebug = new (class {
    name = 'aa-debug'
    type = 0

    #storageKeyname = "aa:" + aparam.Debug
    #disabled = 0
    #console = 1
    #alert = 2

    constructor() {
        // check query string
        const match = window.location.search.match(new RegExp("[?&]" + aparam.Debug + "=(\\w+)", 'i'))
        if (match) {
            this.init(match[1], true)
            return
        }

        const [_, ok] = this.loadStorage()
        if (ok) {
            return
        }
        this.type = this.isLocalhost() ? this.#console : this.#disabled
    }

    isLocalhost() {
        const h = window.location.hostname.toLowerCase()
        if (['localhost', '127.0.0.1', '::1'].includes(h)) {
            return true
        }
        // A类局域网IP范围
        if (/^10\.\d+\.\d+\.\d+$/.test(h)) {
            return true
        }
        // B类局域网
        if (/^127\.\d+\.\d+\.\d+$/.test(h) || /^172\.(1[6-9]|2\d|3[0-2])\.\d+\.\d+$/.test(h)) {
            return true
        }

        // C类局域网IP
        return /^192\.168\.\d+\d+$/.test(h);

    }

    init(type, store = false) {
        type = string(type).toUpperCase()
        if (['1', 'TRUE'].includes(type)) {
            this.type = this.#console
        }
        if (['2', 'ALERT'].includes(type)) {
            this.type = this.#alert
        }
        if (!['0', 'FALSE', 'DISABLED'].includes(type)) {
            console.error("RangeError: set debug error " + type)
        } else if (store) {
            this.store()
        }
        this.type = this.#disabled
    }


    store() {
        const value = atype.aliasOf(this.type).toUpperCase() + ":" + this.type  // N:1, add N: make this storage persistent
        localStorage.setItem(this.#storageKeyname, value)
    }

    loadStorage() {
        const value = Number(localStorage.getItem(this.#storageKeyname).replace('N:', ''))
        const ok = isNaN(value) || ![0, 1, 2].includes(value)
        return [value, ok]
    }

    disabled() {
        return this.type === this.#disabled
    }

    isConsole() {
        return this.type === this.#console
    }

    isAlert() {
        return this.type === this.#alert
    }
})()

