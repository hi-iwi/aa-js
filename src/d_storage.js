// 不要  extends Storage，会报错
const _aaPseudoStorage_ = new class {
    constructor() {
    }

    get length() {
        log.warn("it's a pseudo storage!")
        return Object.keys(this).length
    }
    // 不用报错，正常人也不会这么操作
    // set length(name) {
    //     throw new SyntaxError("storage length is readonly")
    // }


    key(index) {
        log.warn("it's a pseudo storage!")
        let keys = Object.keys(this)
        return keys.length > index ? keys[index] : null
    }

    setItem(key, value, options) {
        log.warn("it's a pseudo storage!")
        cookieStorage[key] = string(value)
    }

    getItem(key, options) {
        log.warn("it's a pseudo storage!")
        return typeof this[key] === "string" ? this[key] : null
    }

    remove(key, options) {
        log.warn("it's a pseudo storage!")
        if (typeof this[key] === "string") {
            delete this[key]
        }
    }

    clear() {
        log.warn("it's a pseudo storage!")
        Object.keys(this).map(key => {
            if (typeof this[key] === "string") {
                delete this[key]
            }
        })
    }
}


class _aaStorage {
    name = 'aa-storage'
    //@readonly
    prefix = 'a:'
    // @type Storage
    #cookieStorage
    // @type Storage
    #localStorage = window.localStorage
    // @type Storage
    #sessionStorage = window.sessionStorage

    persistentNames = []  // both session/storage/cookie
    persistentSessionNames = []
    persistentStorageNames = []
    persistentCookieNames = []


    get length() {
        return this.#localStorage.length
    }

    // set length(value) {
    //     throw SyntaxError("storage length is readonly")
    // }

    get size() {
        return this.#localStorage.length + this.#sessionStorage.length + this.#cookieStorage.length
    }

    // set size(value) {
    //     throw SyntaxError("storage size is readonly")
    // }

    constructor() {

    }

    // @param {Storage} cookieStorage
    setCookieStorage(cookieStorage) {
        this.#cookieStorage = cookieStorage
        return this
    }

    keyname(key) {
        return this.prefix + key
    }

    unpackKeyname(key) {
        return key.indexOf(this.prefix) === 0 ? key.replace(this.prefix, '') : key
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
        return value
    }

    /**
     *
     * @param {Storage} storage
     * @return {null|{[key:string]:string}}
     */
    filterPersistentData(storage) {
        let pers = {}

        let perNames = null
        switch (storage) {
            case this.#localStorage:
                perNames = this.persistentStorageNames
                break
            case this.#sessionStorage:
                perNames = this.persistentSessionNames
                break
            case this.#cookieStorage:
                perNames = this.persistentCookieNames
                break
        }


        for (let i = 0; i < storage.length; i++) {
            let k = storage.key(i)
            let rawKey = this.unpackKeyname(k)
            let v = storage.getItem(k)
            if (this.persistentNames && this.persistentNames.includes(rawKey)) {
                pers[k] = v
                continue
            }

            if (perNames && perNames.includes(rawKey)) {
                pers[k] = v
                continue
            }
            if (v === null || v.length < 3 || v.substring(1, 2) !== ":") {
                continue
            }

            let type = v.charAt(0)
            //  unclearable caches
            // 大写字母: 开头，表示不可清空
            if (type >= "A" && type <= "Z") {
                pers[k] = v
            }
        }
        return len(pers) > 0 ? pers : null
    }

    key(index) {
        return this.#localStorage.key(index)
    }

    /**
     * Iterate storage
     * @param {function(value:string, key:string)} callback
     */
    forEach(callback) {
        for (let i = 0; i < this.length; i++) {
            let key = this.key(i)
            let value = this.getItem(key)
            callback(value, key)
        }
    }


    // @param {{[key:string]:any}}
    setItems(items, persistent = false) {
        for (let [key, value] of Object.entries(items)) {
            this.setItem(key, value, persistent)
        }
    }

    setItem(key, value, persistent = false) {
        key = this.keyname(key)
        value = this.#makeValue(value, persistent)
        this.#localStorage.setItem(key, value)
        this.length = this.#localStorage.length
    }

    getItem(key) {
        key = this.keyname(key)
        return this.#localStorage.getItem(key)
    }

    remove(key) {
        key = this.keyname(key)
        this.#localStorage.removeItem(key)
        this.length = this.#localStorage.length
    }


    clear() {
        let pers = this.filterPersistentData(this.#localStorage)
        this.#localStorage.clear()
        this.length = this.#localStorage.length
        if (len(pers) > 0) {
            this.setItems(pers)
        }
    }

    sessionLength() {
        return this.#sessionStorage.length
    }

    /**
     * Iterate sessions
     * @note for each + singular
     * @param {function(value:string, key:string)} callback
     */
    forEachSession(callback) {
        for (let i = 0; i < this.sessionLength(); i++) {
            let key = this.sessionKey(i)
            let value = this.getSession(key)
            callback(key, value)
        }
    }

    sessionKey(index) {
        return this.#sessionStorage.key(index)
    }

    setSession(key, value, persistent = false) {
        key = this.keyname(key)
        value = this.#makeValue(value, persistent)
        this.#sessionStorage.setItem(key, value)
    }

    getSession(key) {
        key = this.keyname(key)
        return this.#sessionStorage.getItem(key)
    }

    removeSession(key) {
        key = this.keyname(key)
        this.#sessionStorage.removeItem(key)
    }

    clearSession() {
        this.#sessionStorage.clear()
    }

    cookieLength() {
        return this.#cookieStorage.length
    }

    /**
     * Iterate cookies
     * @note for each + singular
     * @param {function(value:string, key:string)} callback
     * @param {{[key:string]:*}} [options]
     */
    forEachCookie(callback, options) {
        for (let i = 0; i < this.cookieLength(); i++) {
            let key = this.cookieKey(i)
            let value = this.getCookie(key, options)
            callback(key, value)
        }
    }

    cookieKey(index) {
        return this.#cookieStorage.key(index)
    }

    setCookie(key, value, options) {
        // cookie 的 key 不需要修改
        value = this.#makeValue(value, false)
        this.#cookieStorage.setItem(key, value, options)
    }

    getCookie(key, options) {
        // cookie 的 key 不需要修改
        return this.#cookieStorage.getItem(key, options)
    }

    removeCookie(key, options) {
        // cookie 的 key 不需要修改
        this.#cookieStorage.removeItem(key, options)
    }

    clearCookie() {
        this.#cookieStorage.clear()
    }

    clearAll() {
        this.clear()
        this.clearSession()
        this.clearCookie()
    }
}