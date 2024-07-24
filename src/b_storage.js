class _aaPseudoStorage {
    name = 'aa-pseudo-storage'

    get length() {
        log.warn(`length: it's a pseudo storage!`)
        return Object.keys(this).length
    }

    constructor() {
    }

    // 不用报错，正常人也不会这么操作
    // set length(name) {
    //     throw new SyntaxError("storage length is readonly")
    // }


    key(index) {
        log.warn(`key(${index}): it's a pseudo storage!`)
        let keys = Object.keys(this)
        return keys.length > index ? keys[index] : null
    }


    setItem(key, value, _) {
        log.warn(`setItem(${key}, ${value}): it's a pseudo storage!`)
        cookieStorage[key] = string(value)
    }

    getItem(key, _) {
        log.warn(`getItem(${key}): it's a pseudo storage!`)
        return typeof this[key] === "string" ? this[key] : null
    }

    removeItem(key, _) {
        log.warn(`removeItem(${key}): it's a pseudo storage!`)
        if (typeof this[key] === "string") {
            delete this[key]
        }
    }

    clear() {
        log.warn(`clear(): it's a pseudo storage!`)
        Object.keys(this).map(key => {
            if (typeof this[key] === "string") {
                delete this[key]
            }
        })
    }
}


class _aaStorage {
    name = 'aa-storage'

    #storage
    #persistentNames = []
    #withOptions = false

    // 是否保存格式
    #encapsulate = false


    get length() {
        return this.#storage.length
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
        this.#storage = storage
        if (typeof persistentNames !== "undefined") {
            this.setPersistentNames(persistentNames)
        }
        this.#withOptions = bool(withOptions)
        this.#encapsulate = bool(encapsulate)
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


    isPseudo() {
        return this.#storage instanceof _aaPseudoStorage
    }

    /**
     * @param {[string]} persistentNames
     */
    setPersistentNames(persistentNames) {
        this.#persistentNames = persistentNames ? persistentNames : []
    }


    getPersistentNames() {
        let items = []
        this.forEach((key, value) => {
            if (array(aparam, 'PersistentNames').includes(key)) {
                items.push(key)
                return
            }
            if (this.#persistentNames.includes(key)) {
                items.push(key)
                return
            }
            if (!value || value.length < 3 || value.substring(1, 2) !== ":") {
                return
            }

            let type = value.charAt(0)
            // persistent data starts with uppercase
            if (type >= "A" && type <= "Z") {
                items.push(key)
            }
        })
        return items.length > 0 ? items : null
    }

    /**
     * Iterate storage
     * @param {function(key:string,value:string)} callback
     * @param [options]
     */
    forEach(callback, options) {
        for (let i = 0; i < this.length; i++) {
            let key = this.key(i)
            let value = this.getItem(key, options)
            if (callback(key, value) === BreakSignal) {
                break
            }
        }
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
            value = this.#makeValue(value, persistent)
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

    getItem(key, options) {
        const args = this.#withOptions && options ? [key, options] : [key]
        let value = this.#storage.getItem(...args)
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
     * @param [options]
     */
    getItems(key, options) {
        if (!(key instanceof RegExp)) {
            log.error('storage.getItems: key must be a RegExp', key)
            return
        }
        let items = {}
        this.forEach((k, _) => {
            if (key.test(k)) {
                const args = this.#withOptions && options ? [k, options] : [k]
                items[k] = this.#storage.getItem(...args)
            }
        }, options)
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
     * @param {RegExp} key
     * @param [options]
     */
    removeItems(key, options) {
        if (!(key instanceof RegExp)) {
            log.error('storage.removeItems: key must be a RegExp', key)
            return
        }

        this.forEach((k, _) => {
            if (key.test(k)) {
                const args = this.#withOptions && options ? [k, options] : [k]
                this.#storage.removeItem(...args)
            }
        }, options)

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
        this.forEach((key, _) => {
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

    #makeValue(value, persistent = false) {
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


class _aaStorageFactor {
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
        this.local = new _aaStorage(localStorage || window.localStorage, [], false, true)
        this.session = new _aaStorage(sessionStorage || window.sessionStorage, [], false, true)
        this.cookie = new _aaStorage(cookieStorage || new _aaPseudoStorage(), [], true, false)
    }

    /**
     * Get item from all storages
     * @param {string} key
     * @param [options]
     */
    getEntire(key, options) {
        let value
        if (!this.cookie.isPseudo()) {
            value = this.cookie.getItem(key, options)
            if (value) {
                return value
            }
        }
        if (!this.session.isPseudo()) {
            value = this.session.getItem(key, options)
            if (value) {
                return value
            }
        }
        return this.local.isPseudo() ? null : this.local.getItem(key, options)
    }

    /**
     * Remove items from all storages
     * @param {string|RegExp} key
     * @param options
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
     * @param {function(key:string,value:string)} callback
     * @param {{[key:string]:*}} [options] cookie options
     */
    forEachEntire(callback, options) {
        this.local.forEach(callback)
        this.session.forEach(callback)
        this.cookie.forEach(callback)
    }
}