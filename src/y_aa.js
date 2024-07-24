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

    //@type _aaOSS
    oss

    constructor() {
        const uri = this.uri

        const registry = new _aaRegistry()
        const storage = new _aaStorageFactor()
        const cache = new _aaCache(storage.session)
        const db = new _aaCache(storage.local)

        const rawFetch = new _aaRawFetch(storage, uri)
        const auth = new _aaAuth(storage, rawFetch)
        const openidAuth = new _aaAuthOpenid(storage, auth)
        const fetch = new _aaFetch(uri, rawFetch, auth)
        const oss = new _aaOSS()

        this.registry = registry
        this.storage = storage
        this.cache = cache
        this.db = db
        this.auth = auth
        this.openidAuth = openidAuth
        this.oss = oss
        this.fetch = fetch
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
    apollo(url, fingerprintGenerator, loginDataHandler, storage = this.storage.local) {
        return new _aaApollo(this.fetch, url, fingerprintGenerator, loginDataHandler, storage)
    }

}


