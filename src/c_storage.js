/**
 * @import
 * @typedef {{ persistent?:boolean, expires?:number|Date|string, path?:string, secure?:boolean, sameSite?:string }} StorageOptions
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

    // constructor() {
    //     super()
    //
    // }

    available() {
        return typeof document !== 'undefined'
    }

    /**
     *
     * @param {number} index
     * @return {string|null}
     */
    key(index) {
        const all = this.getAll()
        const keys = all ? Object.keys(all) : []
        return keys.length > index ? keys[index] : null
    }

    /**
     *
     * @param {string} value
     * @return {string}
     */
    #read(value) {
        if (value[0] === '"') {
            value = value.slice(1, -1)
        }
        return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
    }

    /**
     * @param {string} value
     * @return {string}
     */
    #write(value) {
        return encodeURIComponent(value).replace(/%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g, decodeURIComponent)
    }

    /**
     *
     * @param {IteratorCallback} callback
     * @param {(value:any)=>any} [valueHandler]
     */
    forEach(callback, valueHandler) {
        let result = []   // React 会需要通过这个渲染array/struct
        const all = this.getAll()
        if (!all) {
            return result
        }
        for (let [key, value] of Object.entries(all)) {
            if (typeof valueHandler === "function") {
                value = valueHandler(value)
            }
            const r = callback(key, value)
            if (r === BREAK_SIGNAL) {
                break
            }
            result.push(r)
        }
        return result
    }

    /**
     *
     * @param {string } key
     * @param {string|number} value
     * @param {StorageOptions} [options]
     */
    setItem(key, value, options) {
        if (!this.available()) {
            return
        }
        options = map.fillUp(options, this.defaultOptions)
        if (typeof options.expires === 'number') {
            options.expires = new Date(Date.now() + options.expires)  // 多少ms后过期
        }
        if (options.expires instanceof Date) {
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

    /**
     * Get all
     * @return {struct|null}
     */
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

    /**
     *
     * @param {string} key
     * @return {*|null}
     */
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
     * @param {StorageOptions} [options]
     */
    removeItem(key, options) {
        this.setItem(key, '', map.fillUp({expires: -3600 * 48}, options))
    }

    /**
     * Note that this code has two limitations:
     *
     * It will not delete cookies with HttpOnly flag set, as the HttpOnly flag disables JavaScript's access to the cookie.
     * It will not delete cookies that have been set with a Path value. (This is despite the fact that those cookies will appear in document.cookie, but you can't delete it without specifying the same Path value with which it was set.)
     * @param {StorageOptions} [options]
     */
    clear(options) {
        if (!this.available() || !document.cookie) {
            return
        }
        this.forEach((key, _) => {
            this.removeItem(key, options)
        })
    }
}


class AaStorageEngine {
    name = 'aa-storage-engine'

    static DefaultSeparator = ':'
    static DefaultSubSeparator = '.'

    /** @type {number} */
    defaultExpiresIn

    // 这个不要设为私有，否则外面使用会 attempted to get private field on non-instance
    #storage
    #persistentNames = []
    #withOptions = false

    // 是否封装value格式
    #encapsulate = false


    get length() {
        return this.#storage.length
    }

    get instanceName() {
        const s = this.#storage
        if (s === localStorage) {
            return 'window.localStorage'
        }
        if (s === sessionStorage) {
            return 'window.sessionStorage'
        }
        return s.name
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
     * @param {Storage|function|object} storage
     * @param {[string]} [persistentNames]
     * @param {boolean} [withOptions]
     * @param {boolean} [encapsulate]
     * @param {number} [defaultExpiresIn]
     */
    constructor(storage, persistentNames, withOptions, encapsulate, defaultExpiresIn = 0) {
        panic.arrayErrorType(persistentNames, 'string', OPTIONAL)

        this.#storage = storage
        if (typeof persistentNames !== "undefined") {
            this.setPersistentNames(persistentNames)
        }
        if (typeof withOptions === "boolean") {
            this.#withOptions = withOptions
        }
        if (typeof encapsulate === "boolean") {
            this.#encapsulate = encapsulate
        }
        this.defaultExpiresIn = int54(defaultExpiresIn);
    }

    cleanExpired() {
        if (!this.#encapsulate) {
            return
        }
        const keys = Object.keys(this.#storage)
        if (!keys) {
            return
        }
        // 要保持外面forEach 进行删除操作时安全，就必须要遍历一个独立的数组，而不是直接遍历并操作原数组（破坏序列）
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            let value = this.#storage.getItem(key)
            const {expired} = this.decodeValue(key, value)
            if (expired) {
                this.removeItem(key)
            }
        }
    }

    /**
     * @param {string[]} persistentNames
     */
    setPersistentNames(persistentNames) {
        panic.arrayErrorType(persistentNames, 'string', OPTIONAL)
        this.#persistentNames = persistentNames ? persistentNames : []
    }


    getPersistentValues() {
        let items = {}
        // 这里是是获取raw数据
        this.forEach((key, value) => {
            if (array(aparam, 'PersistentNames').includes(key)) {
                items[key] = value
                return
            }
            if (this.#persistentNames.includes(key)) {
                items[key] = value
                return
            }
            if (typeof value === 'undefined') {
                return
            }
            const {persistent, expired} = this.decodeValue(key, value)
            if (persistent && !expired) {
                items[key] = value
            }
        }, true)

        return len(items) > 0 ? items : null
    }


    /**
     * Iterate storage
     * @param {IteratorCallback} callback
     * @param {boolean} [raw]
     */
    forEach(callback, raw = false) {
        if (typeof this.#storage.forEach === "function") {
            return this.#storage.forEach(callback)
        }
        let result = []
        const keys = Object.keys(this.#storage)
        if (!keys) {
            return result
        }
        // 要保持外面forEach 进行删除操作时安全，就必须要遍历一个独立的数组，而不是直接遍历并操作原数组（破坏序列）
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i]
            let value = raw ? this.#storage.getItem(key) : this.getItem(key)
            const r = callback(key, value)
            if (r === BREAK_SIGNAL) {
                break
            }
            result.push(r)
        }
        return result
    }

    getAll() {
        if (this.length === 0) {
            return null
        }
        if (typeof this.#storage.getAll === "function") {
            return this.#storage.getAll()
        }
        let data = {}
        this.forEach((key, value) => {
            data[key] = value
        })
        return data
    }

    key(index) {
        return this.#storage.key(index)
    }

    /**
     * Set Item
     * @param {string} key
     * @param {any} value
     * @param {StorageOptions} [options]
     */
    setItem(key, value, options) {

        if (this.defaultExpiresIn > 0) {
            options = map.setNotExist(options, 'expires', this.defaultExpiresIn)
        }
        if (this.#encapsulate) {
            value = AaStorageEngine.encodeValue(value, options)
        }
        const args = this.#withOptions && options ? [key, value, options] : [key, value]
        this.#storage.setItem(...args)
    }

    /**
     * Set items in key:value pairs
     * @param {struct} items
     * @param {StorageOptions} [options]
     */
    setItems(items, options) {
        for (let [key, value] of Object.entries(items)) {
            this.setItem(key, value, options)
        }
    }

    /**
     * Get item, returns null on not exists
     * @param key
     * @return {null|*}
     */
    getItem(key) {
        let raw = this.#storage.getItem(key)
        const {value} = this.decodeValue(key, raw)  // decodeValue will remove expired key
        return value
    }

    /**
     * Get items matched with key
     * @param {RegExp} reg
     */
    getItems(reg) {
        let items = {}
        this.forEach((key, value) => {
            if (reg.test(key)) {
                items[key] = value
            }
        })
        return items.length === 0 ? null : items
    }

    /**
     * Remove item from this storage
     * @param {string} key
     * @param {StorageOptions} [options]
     */
    removeItem(key, options) {
        const args = this.#withOptions && options ? [key, options] : [key]
        this.#storage.removeItem(...args)

    }

    /**
     * Remove items matched with key
     * @param {RegExp} key separator colon ':' is wildcard separator. it matches the engine's separator and subSeparator
     * @param {StorageOptions} [options]
     */
    removeItems(key, options) {
        let wild = null
        const sep = this.separator
        const sub = this.subSeparator
        const source = key.source
        if ((sep !== AaStorageEngine.DefaultSeparator || sub !== AaStorageEngine.DefaultSubSeparator) && source.indexOf(':') > -1) {
            source.replace(/:/, '[' + strings.escapeReg(`${sep}${sub}`) + ']')
            wild = new RegExp(source)
        }

        this.forEach((k,) => {
            if (key.test(k) || (wild && wild.test(k))) {
                const args = this.#withOptions && options ? [k, options] : [k]
                this.#storage.removeItem(...args)
            }
        })
    }

    /**
     * Clear all data except persistent data and ignores data from this storage
     * @param {string[]} [ignores]
     * @param {boolean} force
     */
    clearExcept(ignores, force = false) {
        panic.arrayErrorType(ignores, 'string', OPTIONAL)
        let keepData = ignores ? [...ignores] : []
        if (!force) {
            const pers = this.getPersistentValues()
            keepData = pers ? keepData.concat(Object.keys(pers)) : keepData
        }

        if (len(keepData) === 0) {
            this.#storage.clear()
            return
        }

        this.forEach((key, _) => {
            if (!keepData.includes(key)) {
                log.print(this.instanceName, "DELETE", key, keepData[key])
                this.#storage.removeItem(key)
            }
        })
    }

    /**
     * Clear all data except persistent data from this storage
     * @param {boolean} force
     */
    clear(force = false) {
        this.clearExcept(void [], force)
    }

    /**
     *
     * @param {string} key
     * @param value
     * @return {{expired: boolean, persistent: boolean, value}}   [value, expired]
     */
    decodeValue(key, value) {
        let expired = false
        let persistent = false
        if (!this.#encapsulate || typeof value !== "string") {
            return {value, persistent, expired}
        }
        let match = value.match(/^(.*)\s\|([a-zA-Z])(\d*)$/)
        if (!match) {
            this.removeItem(key)  // 异常数据，清除为妙
            return {value: null, persistent, expired}
        }
        value = match[1]
        let type = match[2]
        persistent = type >= 'A' && type <= 'Z'

        let expireTo = number(match[3])
        switch (type.toLowerCase()) {
            case atype.alias._serializable:
                let arr = value.split('::')
                let className = arr[0]
                value = arr.slice(1).join('::')
                try {
                    value = AaHack.class(className).serialize(value)
                } catch (err) {
                    this.removeItem(key)
                    return {value: null, persistent, expired: true}
                }
                break
            case atype.alias.array:
            case atype.alias.struct:
                try {
                    value = JSON.parse(value)
                } catch (error) {
                    log.error(`storage parse ${value} failed: ${error}`)
                }
                break
            case atype.alias.bigint:
                value = BigInt(value)
                break
            case atype.alias.boolean:
                value = bool(value)
                break
            case atype.alias.null:
                value = (value === "null") ? null : undefined
                break
            case atype.alias.number:
                value = int54(value)
                break
            case atype.alias.date:
                value = new Date(value)
                break
            case atype.alias.regexp:
                value = new RegExp(value)
                break
            case atype.alias.string:
                break
        }
        if (typeof value === 'undefined' || (expireTo > 0 && Date.now() - expireTo >= 0)) {
            this.removeItem(key)
            return {value: null, persistent, expired: true}
        }
        return {value, persistent, expired}
    }

    /**
     * @param {any} value
     * @param {StorageOptions} [options]
     * @return {*}
     */
    static encodeValue(value, options) {
        let ok = true;
        let typeAlias

        if (atype.isSerializable(value)) {
            typeAlias = atype.alias._serializable
            const className = value.constructor.name
            value = value.serialize()
            value = className + '::' + value
        } else {
            const type = atype.of(value)
            typeAlias = atype.aliasOf(type)
            switch (type) {
                case atype.number:
                    break
                case atype.boolean:
                    value = booln(value)
                    break;
                case atype.array:
                case atype.class:
                case atype.struct:
                    value = strings.json(value)
                    break;
                case atype.date:
                    value = value.valueOf()
                    break;
                case atype.function:
                case atype.undefined:
                    ok = false
                    break;
            }
        }

        if (!ok) {
            return value
        }
        const persistent = bool(options, 'persistent')
        let expires = defval(options, 'expires')
        if (typeof expires === "number") {
            expires = Date.now() + expires
        } else if (expires instanceof Date) {
            expires = expires.valueOf()
        }

        if (bool(persistent)) {
            typeAlias = typeAlias.toUpperCase()
        }
        // 没必要通过计算本年差来缩短expires（这样最多缩短1位长度）；缩短为秒也最多缩短3位长度
        // base64数字会变得更长，直接存毫秒，用存储空间换CPU计算时间
        value = value + ' |' + typeAlias + string(expires)
        return value
    }
}


class AaStorageFactor {
    name = 'aa-storage-factor'
    static DailyCleanSessionKey = 'aa:storage:daily_clean'

    /** @type {AaStorageEngine} */
    local
    /** @type {AaStorageEngine} */
    session
    /** @type {AaStorageEngine} */
    cookie


    get length() {
        return this.local.length + this.session.length + this.cookie.length
    }

    /**
     *
     * @param {Storage} [cookieStorage]
     * @param {Storage} [localStorage]
     * @param {Storage} [sessionStorage]
     */
    constructor(cookieStorage, localStorage, sessionStorage) {
        this.local = new AaStorageEngine(localStorage ? localStorage : window.localStorage, [], false, true, 7 * time.Day)
        this.session = new AaStorageEngine(sessionStorage ? sessionStorage : window.sessionStorage, [], false, true)
        this.cookie = new AaStorageEngine(cookieStorage ? cookieStorage : new AaCookieStorage(), [], true, false)

        this.cleanExpired()
    }

    cleanExpired() {
        const cleaned = this.session.getItem(AaStorageFactor.DailyCleanSessionKey)
        if (cleaned) {
            return
        }
        this.local.cleanExpired()
        this.session.cleanExpired()
        // this.cookie.cleanExpired()
        this.session.setItem(AaStorageFactor.DailyCleanSessionKey, 1)
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
     * @param {boolean} force
     */
    clearAll(force = false) {
        this.local.clear(force)
        this.session.clear(force)
        this.cookie.clear(force)
    }

    /**
     * Clear all data except some fields from all storages
     * @param {string[]} [ignores] ignore these fields
     */
    clearAllExcept(ignores) {
        panic.arrayErrorType(ignores, 'string', OPTIONAL)
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