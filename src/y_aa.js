class Aa {
    name = 'aa'
    /** @type {typeof AaDOM} */
    dom = AaDOM

    paths=AaPath

    /** @type {typeof AaHack} */
    hack = AaHack

    /** @type {AaRegistry} */
    registry

    scrollEvent

    /** @type {AaStorageFactor} */
    storage
    cache
    /** @type {AaCache} */
    db


    /** @type {typeof AaURI} */
    uri = AaURI
    /** @type {typeof AaValidator} */
    validator = AaValidator

    /** @type {AaEnv} */
    env = AaEnv


    /** @type {AaAuth} */
    auth


    /** @type {AaFetch} */
    fetch

    /** @type {AaAuthOpenid} */
    openidAuth

    /** @type {AaAccount} */
    account

    /** @type {AaOSS} */
    oss

    /** @type {AaEditor} */
    editor

    constructor() {
        const registry = new AaRegistry()
        const scrollEvent = new AaScrollEvent()
        const storage = new AaStorageFactor()
        const cache = new AaCache(storage.session)
        const db = new AaCache(storage.local)

        const rawFetch = new AaRawFetch(storage)
        const auth = new AaAuth(storage, rawFetch)
        const fetch = new AaFetch(rawFetch, auth)
        const openidAuth = new AaAuthOpenid(storage.session, auth, fetch)
        const account = new AaAccount(db, auth, fetch)
        const oss = new AaOSS()
        const editor = new AaEditor(oss)

        this.registry = registry
        this.scrollEvent = scrollEvent
        this.storage = storage
        this.cache = cache
        this.db = db
        this.auth = auth
        this.openidAuth = openidAuth
        this.fetch = fetch
        this.account = account
        this.oss = oss
        this.editor = editor
    }

    /**
     * @param {Class|function|string|*} tableName
     * @param {AaCache} db
     * @param {AaCachePattern} [pattern]
     * @param {StorageOptions} [options]
     */
    archive(tableName, db, pattern, options) {
        return new AaArchive(...arguments)
    }

    compare(a, b) {
        if (!(a && b)) {
            return false
        }
        switch (typeof a) {
            case 'string':
            case 'number':
                return eq(a, b)
            case 'object':

                if (typeof a.toJSON === 'function') {
                    return typeof b.toJSON === 'function' ? a.toJSON() === b.toJSON() : false
                }

                /**
                 * `jsonkey` is a reserved json field to indicate the value of the key name of this struct.
                 *  1. `jsonkey` field must be a string. It can be an empty string.
                 *  2. if `jsonkey` is not an empty string, its value is the key name of the value of this struct
                 *  3. if `jsonkey` is an empty string, try the `value` or `id` or `path` properties
                 */
                if (typeof a.jsonkey === "string") {
                    let key = a.jsonkey ? a.jsonkey : (a.hasOwnProperty('value') ? 'value' : (a.hasOwnProperty('id') ? 'id' : 'path'))
                    if (a.hasOwnProperty(key)) {
                        return b.hasOwnProperty(key) ? a[key] === b[key] : false
                    }
                }

                if (typeof a.toString === "function" && a.toString().indexOf('[object ') !== 0) {
                    return typeof b.toString === 'function' ? a.toString() === b.toString() : false
                }
                // time, Date
                if (typeof a.valueOf === "function") {
                    return typeof b.valueOf === 'function' ? a.valueOf() === b.valueOf() : false
                }
        }
        return a === b
    }

    // imgSrc ===> aa.oss.imgSrc

    mselects(opts, cast, inherit = false) {
        return new AaMultiLevelSelects(...arguments)
    }

    path(path){
        return new AaPath(path)
    }
    /**
     *
     * @param {string} url
     * @param {struct|map|URLSearchParams|*} [params]
     * @param {string} [hash]
     * @return {AaURI}
     */
    url(url = location.href, params, hash) {
        return new AaURI(...arguments)
    }


}


