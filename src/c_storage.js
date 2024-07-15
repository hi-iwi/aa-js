class _aaStorageNotImplemented {
    errmsg

    constructor(type = '') {
        this.errmsg = type + " storage is not implemented"
    }

    key(index) {
        throw new ReferenceError(this.errmsg)
    }

    setItem(key, value) {
        throw new ReferenceError(this.errmsg)
    }

    getItem(key) {
        throw new ReferenceError(this.errmsg)
    }

    remove(key) {
        throw new ReferenceError(this.errmsg)
    }

    clear() {
        throw new ReferenceError(this.errmsg)
    }

}

class _aaStorage {
    name = 'aa-storage'
    //@readonly
    prefix = 'a:'
    // @type Storage
    cookieStorage
    // @type Storage
    localStorage = window.localStorage
    // @type Storage
    sessionStorage = window.sessionStorage

    static new(cookieStorage) {
        return new _aaStorage(cookieStorage)
    }
    // @param {Storage} [cookieStorage]
    constructor(cookieStorage) {
        this.cookieStorage = cookieStorage instanceof Storage ? cookieStorage : new _aaStorageNotImplemented('cookie')
    }

    // @param {Storage} cookieStorage
    setCookieStorage(cookieStorage) {
        this.cookieStorage = cookieStorage
        return this
    }

    keyname(key) {
        return this.prefix + key
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
    }

    key(index) {
        return this.localStorage.key(index)
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
        this.localStorage.setItem(key, value)
        this.length = this.localStorage.length
    }

    getItem(key) {
        key = this.keyname(key)
        this.localStorage.getItem(key)
    }

    remove(key) {
        key = this.keyname(key)
        this.localStorage.removeItem(key)
        this.length = this.localStorage.length
    }

    clear() {
        this.localStorage.clear()
        this.length = this.localStorage.length
    }

    sessionKey(index) {
        return this.sessionStorage.key(index)
    }

    setSession(key, value, persistent = false) {
        key = this.keyname(key)
        value = this.#makeValue(value, persistent)
        this.sessionStorage.setItem(key, value)
    }

    getSession(key) {
        key = this.keyname(key)
        this.sessionStorage.getItem(key)
    }

    removeSession(key) {
        key = this.keyname(key)
        this.sessionStorage.removeItem(key)
    }

    clearSession() {
        this.sessionStorage.clear()
    }


    cookieKey(index) {
        return this.cookieStorage.key(index)
    }

    setCookie(key, value, persistent = false) {
        key = this.keyname(key)
        value = this.#makeValue(value, persistent)
        this.cookieStorage.setItem(key, value)
    }

    getCookie(key) {
        key = this.keyname(key)
        this.cookieStorage.getItem(key)
    }

    removeCookie(key) {
        key = this.keyname(key)
        this.cookieStorage.removeItem(key)
    }

    clearCookie() {
        this.cookieStorage.clear()
    }

    clearAll() {
        this.clear()
        this.clearSession()
        this.clearCookie()
    }
}