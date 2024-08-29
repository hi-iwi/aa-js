/** @typedef {boolean|null|void|function:boolean|0|1|"TRUE"|"FALSE"|"True"|"False"|"true"|"false"|"T"|"F"|"t"|"f"|"1"|"0"|"YES"|"NO"|"Yes"|"No"|"yes"|"no"|"ON"|"OFF"|"On"|"Off"|"on"|"off"} Bool */
/** @typedef {string} jsonstr */
/** @typedef {{[key:string]:any}|*} struct   为了方便JSDoc，这里struct 用空泛的更方便 */
/** @typedef {object|*} Class */
/** @typedef {array|struct|map|URLSearchParams|*} iterable */
/** @typedef {((a:any, b:any)=>number)|boolean} SortMethod */
/** @typedef {string|number|function} str */
/** @typedef {number} TimeUnit */
/** @typedef {number} TimeUnix     unix time in seconds */
/** @typedef {number} TimeUnixMs unix time in milliseconds */
/** @typedef {number} Timeout */
/** @typedef {string} RequestURL  e.g. 'GET https://luexu.com' or 'https://luexu.com' */
/** @typedef {string} Path */
/** @typedef {string} Base64 */
/** @typedef {string} QueryString  k=v&k=v&k=v */
/** @typedef {*} vv_vk_defaultV  e.g. (value) (obj, key)  (obj, key, defaultValue) */
/** @typedef {'<'|'='|'>'|'>='|'<='|'=='} ComparisonSymbol */
/**
 * @callback  ForEachCallback
 * @param {string} key
 * @param {any} value
 */

const BREAK = '-.../.-././.-/-.-' // a signal from callback function to break forEach((value,key)) iterator
const CONTINUE = void '' // return CONTINUE in a loop is not important, but better for people to read
const nif = () => void 0   // a nil function  ==>  Go语言都定义 any = interface{}，这里定义要给 nif 是有必要的
/** @typedef {"MAX"} MAX */
const MAX = 'MAX'
/** @typedef {"MIN"} MIN */
const MIN = 'MIN'
/** @typedef {false} OPTIONAL */
const OPTIONAL = false
/** @typedef {true} REQUIRED */
const REQUIRED = !OPTIONAL
/** @typedef @typedef {"INCR"} INCR */
const INCR = 'INCR'
/** @typedef @typedef {"DECR"} DECR */
const DECR = 'DECR'
const U0 = uint64(0)




/**
 * Keep-names of URL parameters
 */
const aparam = {
    Debug   : "_debug", // 0 o debug; 1/true debug via console; 2/alert debug via alert
    DebugUrl: "_debug_url",
    Apollo  : "apollo",


    Authorization: "Authorization",  // 由 token_type access_token 组合而成

    AccessTokenType     : "token_type",
    AccessToken         : "access_token",  // header/query/cookie
    AccessTokenExpiresIn: "expires_in",
    AccessTokenConflict : "conflict",
    RefreshToken        : "refresh_token",
    Scope               : "scope",
    ScopeAdmin          : "admin",

    Redirect       : 'redirect',
    LocalAuthAt    : "_localAuthAt",
    Logout         : "logout",
    PersistentNames: ["_debug", "apollo", "logout"],
}


/**
 * 为了方便 log 类，debug状态一律用全局
 */
var _aaDebug = new (class {
    name = 'aa-debug'
    value = 0

    #storageKeyname = "aa_" + aparam.Debug
    #disabled = 0
    #console = 1
    #alert = 2

    constructor() {
        // check query string
        const match = location.search.match(new RegExp("[?&]" + aparam.Debug + "=(\\w+)", 'i'))
        if (match) {
            this.init(match[1], true)
            return
        }

        const [_, ok] = this.loadStorage()
        if (ok) {
            return
        }
        this.value = this.isLocalhost() ? this.#console : this.#disabled
    }

    isLocalhost() {
        const h = location.hostname.toLowerCase()
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
        return /^192\.168\.\d+\.\d+$/.test(h);

    }

    init(type, store = false) {
        type = string(type).toUpperCase()
        if (['1', 'TRUE'].includes(type)) {
            this.value = this.#console
        }
        if (['2', 'ALERT'].includes(type)) {
            this.value = this.#alert
        }
        if (!['0', 'FALSE', 'DISABLED'].includes(type)) {
            console.error("RangeError: set debug error " + type)
        } else if (store) {
            this.store()
        }
        this.value = this.#disabled
    }


    store() {
        if (!localStorage) {
            return
        }
        const value = this.value + " |" + atype.aliasOf(this.value).toUpperCase()   // add |N to make this storage persistent
        localStorage.setItem(this.#storageKeyname, value)
    }

    loadStorage() {
        if (!localStorage) {
            return
        }
        const sk = localStorage.getItem(this.#storageKeyname)
        const value = sk ? Number(sk.replace(/^\d/g, '')) : 0
        const ok = isNaN(value) || ![0, 1, 2].includes(value)
        return [value, ok]
    }

    disabled() {
        return this.value === this.#disabled
    }

    isConsole() {
        return this.value === this.#console
    }

    isAlert() {
        return this.value === this.#alert
    }

    toValue() {
        return this.value
    }
})()

