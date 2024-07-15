class Aa {
    // a_
    Date = _aaDate
    Log = _aaLog   // for call static methods
    log

    URI = _aaURI

    Math = _aaMath
    // b_
    Env = _aaEnvironment
    env
    // c_
    storage
    // @type typeof _aaFetch
    Fetch = _aaFetch
    // @type _aaFetch
    fetch

    constructor() {
        let dbg = this.#parseDebug()

        this.env = new _aaEnvironment(dbg)
        this.log = new _aaLog(_aaURI, this.env)
        this.storage = new _aaStorage()

        this.fetch = new _aaFetch()

    }

    setDebug(debug = true) {
        this.env.setDebug(debug)
    }


    #parseDebug() {
        const url = new this.URI()
        if (url.has(aparam.debug)) {
            return url.queryBool(aparam.debug)
        }
        const h = location.hostname.substring(0, 8)
        return ["192.168.", "localhost"].includes(h)
    }

    date(...args){
        return new _aaDate(...args)
    }

    url(url = window.location.href, params = {}) {
        return new this.URI(url, params)
    }


    /**
     * Apollo
     * @param {string } url
     * @param {(fp:string)=>void} fingerprintGenerator 设备唯一码生成器
     * @param {(data:{[key:string]:*})=>void} loginDataHandler 登录处理
     * @param {(k:string)=>string} storageGetter 存储读取方法
     * @param {(k:string, v:string)=>void} storageSetter 存储保存方法
     * @return {_aaApollo}
     */
    apollo(url, fingerprintGenerator, loginDataHandler, storageGetter, storageSetter) {
        return new _aaApollo(this.fetch, url, fingerprintGenerator, loginDataHandler, storageGetter, storageSetter)
    }



}


