class Aa {
    name = 'aa'
    // a_
    // @type typeof _aaPath
    Path = _aaPath


    //@type _aaRegistry
    registry

    //@type typeof _aaTx
    TX = _aaTx

    // @type _aaStorageFactor
    storage
    cache
    db

    // log   log 类是纯静态方法，全局直接使用

    //@type typeof _aaURI
    uri = _aaURI


    // b_

    //@type typeof _aaEnvironment
    env = _aaEnvironment
    // c_
    // @type _aaAuth
    auth
    // @type _aaStateStorage

    // d_

    // @type _aaFetch
    fetch

    // @type_aaAuthOpenid
    openidAuth

    // @type _aaAccount
    account
    //@type _aaOSS
    oss
    // @type _aaEditor
    editor

    constructor() {
        const uri = this.uri

        const registry = new _aaRegistry()
        const storage = new _aaStorageFactor()
        const cache = new _aaCache(storage.session)
        const db = new _aaCache(storage.local)

        const rawFetch = new _aaRawFetch(storage, uri)
        const auth = new _aaAuth(storage, rawFetch)
        const fetch = new _aaFetch(uri, rawFetch, auth)
        const openidAuth = new _aaAuthOpenid(storage, auth, fetch)
        const account = new _aaAccount(db, auth, fetch)
        const oss = new _aaOSS()
        const editor = new _aaEditor(oss)

        this.registry = registry
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

    tx() {
        return new _aaTx()
    }

    path(path) {
        return new _aaPath(path)
    }


    url(url = window.location.href, params = {}) {
        return new this.uri(url, params)

    }


    /**
     * Apollo
     * @param {string } url
     * @param {(fp:string)=>void} fingerprintGenerator 设备唯一码生成器
     * @param {(data:{[key:string]:*})=>void} loginDataHandler 登录处理
     * @param {_aaStorage} [storage]
     * @return {_aaApollo}
     */
    apollo(url, fingerprintGenerator, loginDataHandler, storage = this.storage.cookie) {
        return new _aaApollo(this.fetch, url, fingerprintGenerator, loginDataHandler, storage)
    }

}


