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
const nif = () => void 0   // a nil function  Go语言都定义 any = interface{}，这里定义要给 nif 是有必要的
const nip = new Promise(nif) // a nil promise 既不会执行then，也不会抛出异常
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
 * @warn 这里不能使用 loge() 或 log.xxx()
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
            this.value = this.#parseValue(match[1])
            this.store()
            return
        }

        const [value, ok] = this.loadStorage()
        if (ok) {
            this.value = value
            return
        }
        this.value = this.isLocalhost() ? this.#console : this.#disabled
    }

    disabled() {
        return this.value === this.#disabled
    }

    isAlert() {
        return this.value === this.#alert
    }

    isConsole() {
        return this.value === this.#console
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

    loadStorage() {
        if (!localStorage) {
            return
        }
        let value = localStorage.getItem(this.#storageKeyname)
        if (!value) {
            return [0, false]
        }
        value = this.#parseValue(value.split(" |")[0])
        return [value, true]
    }

    store() {
        if (!localStorage) {
            return
        }
        //@warn 这里是基础函数，不要使用 atype.aliasOf(this.value).toUpperCase()
        const value = this.value + " |N"  // add |N to make this storage persistent
        localStorage.setItem(this.#storageKeyname, value)
    }


    #parseValue(value) {
        if (!value) {
            return this.#disabled
        }
        value = ('' + value).toUpperCase()
        if (['1', 'TRUE'].includes(value)) {
            return this.#console
        }
        if (['2', 'ALERT'].includes(value)) {
            return this.#alert
        }
        return this.#disabled
    }

})()

