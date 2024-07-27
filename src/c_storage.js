/**
 * @import
 */
class AaCookieStorage {
    name = 'aa-cookie-storage'

    // cookie 不能使用 : 等分隔符作为key，因此不同Engine里面自己指定分隔符
    separator = '_'
    subSeparator = '_'

    defaultOptions = {
        //expires: 0,  // Date or Number
        path: '/', //domain: '',
        //secure: true,  // require https
        //sameSite: 'Lax',
    }

    get length() {
        const all = this.getAll()
        return all ? Object.keys(all).length : 0
    }


    available() {
        return typeof document !== 'undefined'
    }

    key(index) {
        const all = this.getAll()
        const keys = all ? Object.keys(all) : []
        return keys.length > index ? keys[index] : null
    }


    #read(value) {
        if (value[0] === '"') {
            value = value.slice(1, -1)
        }
        return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
    }

    #write(value) {
        return encodeURIComponent(value).replace(/%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g, decodeURIComponent)
    }

    /**
     *
     * @param {IteratorCallback} callback
     */
    forEach(callback) {
        const all = this.getAll()
        if (!all) {
            return
        }
        for (const [key, value] of Object.entries(all)) {
            if (callback(value, key) === BreakSignal) {
                break
            }
        }
    }

    setItem(key, value, options) {
        if (!this.available()) {
            return
        }
        options = map.fillUp(options, this.defaultOptions)
        if (typeof options.expires === 'number') {
            options.expires = new Date(Date.now() + options.expires)  // 多少ms后过期
        }
        if (options.expires) {
            options.expires = options.expires.toUTCString()
        }
        key = encodeURIComponent(key)
            .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
            .replace(/[()]/g, escape)

        let s = ''
        for (const [k, v] of Object.entries(options)) {
            if (!v) {
                continue
            }
            s += '; ' + k
            if (v === true) {
                continue
            }
            // Considers RFC 6265 section 5.2:
            // ...
            // 3.  If the remaining unparsed-attributes contains a %x3B (";")
            //     character:
            // Consume the characters of the unparsed-attributes up to,
            // not including, the first %x3B (";") character.
            // ...
            s += '=' + v.split(';')[0]
        }
        document.cookie = key + '=' + this.#write(value) + s
    }

    getAll() {
        if (!this.available() || !document.cookie) {
            return null
        }
        let data = {}
        // 相同key，前面优先
        //  k=v; k=v; k=v; k=xxx=xxx; k; k;
        document.cookie.split('; ').forEach(cookie => {
            let parts = cookie.split('=')
            let key = parts[0]
            let value = parts.slice(1).join('=')  // 有可能是  k=xxx=xxx; k=v; k;

            try {
                data[decodeURIComponent(key)] = value ? this.#read(value) : ''
            } catch {
                // Do nothing...
            }
        })


        return data
    }

    getItem(key) {
        if (!this.available() || !document.cookie) {
            return
        }
        const all = this.getAll()
        return all && typeof all[key] === "string" ? all[key] : null
    }

    /**
     *
     * @param key
     * @param options
     * Note that this code has two limitations:
     *
     * It will not delete cookies with HttpOnly flag set, as the HttpOnly flag disables JavaScript's access to the cookie.
     * It will not delete cookies that have been set with a Path value. (This is despite the fact that those cookies will appear in document.cookie, but you can't delete it without specifying the same Path value with which it was set.)
     */
    removeItem(key, options) {
        this.setItem(key, '', map.fillUp({expires: -3600 * 48}, options))
    }

    /**
     * Note that this code has two limitations:
     *
     * It will not delete cookies with HttpOnly flag set, as the HttpOnly flag disables JavaScript's access to the cookie.
     * It will not delete cookies that have been set with a Path value. (This is despite the fact that those cookies will appear in document.cookie, but you can't delete it without specifying the same Path value with which it was set.)
     */
    clear(options) {
        if (!this.available() || !document.cookie) {
            return
        }
        this.forEach((_, key) => {
            this.removeItem(key, options)
        })
    }
}


class AaStorageEngine {
    name = 'aa-storage-engine'

    static DefaultSeparator = ':'
    static DefaultSubSeparator = '.'

    #storage
    #persistentNames = []
    #withOptions = false

    // 是否封装value格式
    #encapsulate = false


    get length() {
        return this.#storage.length
    }

    get instanceName() {
        return this.#storage.name
    }

    // cookie 不能使用 : 等分隔符作为key，因此不同Engine里面自己指定分隔符
    // 冒号 : 是特殊分隔符，默认都是 : 隔开
    get separator() {
         return string(this.#storage, 'separator', AaStorageEngine.DefaultSeparator)
    }

    get subSeparator() {
         return string(this.#storage, 'subSeparator', AaStorageEngine.DefaultSubSeparator)
    }

    // 不用报错，正常人也不会这么操作
    // set length(name) {
    //     throw new SyntaxError("storage length is readonly")
    // }

    /**
     * @param storage
     * @param {[string]} [persistentNames]
     * @param {boolean} [withOptions]
     * @param {boolean} [encapsulate]
     */
    init(storage, persistentNames, withOptions, encapsulate) {
        if (storage && typeof storage === "object") {
            this.#storage = storage
        }
        if (typeof persistentNames !== "undefined") {
            this.setPersistentNames(persistentNames)
        }
        if (typeof withOptions === "boolean") {
            this.#withOptions = withOptions
        }
        if (typeof encapsulate === "boolean") {
            this.#encapsulate = encapsulate
        }
    }

    /**
     * @param storage
     * @param {[string]} [persistentNames]
     * @param {boolean} [withOptions]
     * @param {boolean} [encapsulate]
     */
    constructor(storage, persistentNames, withOptions, encapsulate) {
        this.init(...arguments)
    }


    /**
     * @param {[string]} persistentNames
     */
    setPersistentNames(persistentNames) {
        this.#persistentNames = persistentNames ? persistentNames : []
    }


    getPersistentNames() {
        let items = []
        // 这里要用原始的，不能用 this.forEach

        for (let i = 0; i < this.length; i++) {
            const key = this.key(i)
            const value = this.#storage.getItem(key)
            if (array(aparam, 'PersistentNames').includes(key)) {
                items.push(key)
                return
            }
            if (this.#persistentNames.includes(key)) {
                items.push(key)
                return
            }
            if (!value) {
                return
            }

            let type = value.charAt(0)
            // persistent data starts with uppercase
            if (type >= "A" && type <= "Z") {
                items.push(key)
            }
        }


        return items.length > 0 ? items : null
    }

    /**
     * Iterate storage
     * @param {IteratorCallback} callback
     */
    forEach(callback) {
        if (typeof this.#storage.forEach === "function") {
            this.#storage.forEach(callback)
            return
        }
        for (let i = 0; i < this.length; i++) {
            let key = this.key(i)
            let value = this.getItem(key)
            if (callback(value, key) === BreakSignal) {
                break
            }
        }
    }

    getAll() {
        if (this.length === 0) {
            return null
        }
        if (typeof this.#storage.getAll === "function") {
            return this.#storage.getAll()
        }
        let data = {}
        this.forEach((value, key) => {
            data[key] = value
        })
        return data
    }

    key(index) {
        return this.#storage.key(index)
    }

    setItem(key, value, options) {
         let persistent = false
        if (typeof options === "boolean") {
            persistent = options
            options = void false  // set to undefined
        }
        if (this.#encapsulate) {
            value = AaStorageEngine.makeValue(value, persistent)
        }
        const args = this.#withOptions && options ? [key, value, options] : [key, value]
        this.#storage.setItem(...args)
    }

    // @param {{[key:string]:any}}
    setItems(items, persistent = false) {
        for (let [key, value] of Object.entries(items)) {
            this.setItem(key, value, persistent)
        }
    }

    getItem(key) {
        let value = this.#storage.getItem(key)
        if (!this.#encapsulate || typeof value !== "string") {
            return value
        }

        let d = value.indexOf(':')
        let type = value.substring(0, d)
        if (type.length === 0 || type.length > 2) {
            return value
        }
        if (type.length === 2) {
            type = type.substring(1)
        }

        value = value.substring(d + 1)
        switch (type.toLowerCase()) {
            case atype.aliasOf(null):
                value = (value === "null") ? null : undefined
                break
            case atype.aliasOf('number'):
                value = int32(value)
                break;
            case atype.aliasOf('boolean'):
                value = bool(value)
                break;
            case atype.aliasOf('array'):
            case atype.aliasOf('struct'):
                value = JSON.parse(value)
                break;
            case atype.aliasOf('date'):
                value = new Date(value)
                break;
        }
        return value
    }

    /**
     * Get items matched with key
     * @param {RegExp} key
     */
    getItems(key) {
        if (!(key instanceof RegExp)) {
            log.error('storage.getItems: key must be a RegExp', key)
            return
        }
        let items = {}
        this.forEach((v, k) => {
            if (key.test(k)) {
                items[k] = v
            }
        })
        return items.length === 0 ? null : items
    }

    /**
     * Remove item from this storage
     * @param {string} key
     * @param [options]
     */
    removeItem(key, options) {
        const args = this.#withOptions && options ? [key, options] : [key]
        this.#storage.removeItem(...args)

    }

    /**
     * Remove items matched with key
     * @param {RegExp} key separator colon ':' is wildcard separator. it matches the engine's separator and subSeparator
     * @param [options]
     */
    removeItems(key, options) {
        if (!(key instanceof RegExp)) {
            log.error('storage.removeItems: key must be a RegExp', key)
            return
        }

        let wild = null
        const sep = this.separator
        const sub = this.subSeparator
        const source = key.source
        if ((sep !== AaStorageEngine.DefaultSeparator || sub !== AaStorageEngine.DefaultSubSeparator) && source.indexOf(':') > -1) {
            source.replace(/:/, '[' + strings.escapeReg(`${sep}${sub}`) + ']')
            wild = new RegExp(source)
        }

        this.forEach((_, k) => {
            if (key.test(k) || (wild && wild.test(k))) {
                const args = this.#withOptions && options ? [k, options] : [k]
                this.#storage.removeItem(...args)
            }
        })
    }

    /**
     * Clear all data except persistent data and ignores data from this storage
     * @param {[string]} [ignores]
     */
    clearExcept(ignores) {
        let keep = this.getPersistentNames()
        if (len(ignores) > 0) {
            keep = !keep ? ignores : keep.concat(ignores)
        }
        if (!keep) {
            this.#storage.clear()
            return
        }
        this.forEach((_, key) => {
            if (typeof keep[key] === "undefined") {
                this.#storage.removeItem(key)
            }
        })
    }

    /**
     * Clear all data except persistent data from this storage
     */
    clear() {
        this.clearExcept()
    }

    static makeValue(value, persistent = false) {
        let ok = true;
        const type = atype.of(value)
        switch (type) {
            case 'number':
                value += ''
                break;
            case 'boolean':
                value = booln(value)
                break;
            case 'array':
            case 'object':
            case 'struct':
                value = JSON.stringify(value)
                break;
            case 'date':
                break;
            case 'function':
            case 'undefined':
                ok = false
                break;
        }
        if (ok) {
            let st = atype.aliasOf(type)
            if (bool(persistent)) {
                st = st.toUpperCase()
            }
            value = st + ':' + value
        }
        return value
    }

}


class AaStorageFactor {
    name = 'aa-storage-factor'

    // @type _aaStorage
    local
    // @type _aaStorage
    session
    // @type _aaStorage
    cookie


    get length() {
        return this.local.length + this.session.length + this.cookie.length
    }


    constructor(cookieStorage, localStorage, sessionStorage) {
        this.local = new AaStorageEngine(localStorage || window.localStorage, [], false, true)
        this.session = new AaStorageEngine(sessionStorage || window.sessionStorage, [], false, true)
        this.cookie = new AaStorageEngine(cookieStorage || new AaCookieStorage(), [], true, false)
    }

    /**
     * Get item from all storages
     * @param {string} key
     */
    getEntire(key) {
        let value = this.cookie.getItem(key)
        if (value) {
            return value
        }

        value = this.session.getItem(key)
        if (value) {
            return value
        }

        return this.local.getItem(key)
    }

    /**
     * Remove items from all storages
     * @param {string|RegExp} key  separator colon ':' is wildcard separator. it matches the engine's separator and subSeparator
     * @param [options]
     */
    removeEntire(key, options) {
        if (key instanceof RegExp) {
            this.local.removeItems(key, options)
            this.session.removeItems(key, options)
            this.cookie.removeItems(key, options)
        } else {
            this.local.removeItem(key, options)
            this.session.removeItem(key, options)
            this.cookie.removeItem(key, options)
        }
    }

    /**
     * Clear from all storages
     */
    clearAll() {
        this.local.clear()
        this.session.clear()
        this.cookie.clear()
    }

    /**
     * Clear all data except some fields from all storages
     * @param {[string]} [ignores] ignore these fields
     */
    clearAllExcept(ignores) {
        this.local.clearExcept(ignores)
        this.session.clearExcept(ignores)
        this.cookie.clearExcept(ignores)
    }

    /**
     * Iterate all storages in the order of localStorage, sessionStorage,  CookieStorage
     * @param {IteratorCallback} callback
     * @param {struct} [options] cookie options
     */
    forEachEntire(callback, options) {
        this.local.forEach(callback)
        this.session.forEach(callback)
        this.cookie.forEach(callback)
    }
}