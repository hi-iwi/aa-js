class Aa {
    name = 'aa'
    // a_


    //@type _aaRegistry
    registry

    scrollEvent

    //@type typeof _aaTx
    TX = AaTx

    // @type _aaStorageFactor
    storage
    cache
    db

    // log   log 类是纯静态方法，全局直接使用

    //@type typeof _aaURI
    uri = AaURI


    // b_

    //@type typeof _aaEnvironment
    env = AaEnv
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
        const tx = AaTx
        const env = AaEnv
        const uri = AaURI

        this.TX = tx
        this.env = env
        this.uri = uri

        const registry = new AaRegistry()
        const scrollEvent = new AaScrollEvent(env)
        const storage = new AaStorageFactor()
        const cache = new AaCache(storage.session)
        const db = new AaCache(storage.local)

        const rawFetch = new AaRawFetch(storage, uri)
        const auth = new AaAuth(storage, rawFetch)
        const fetch = new AaFetch(uri, rawFetch, auth)
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

    tx() {
        return new AaTx()
    }
 
    url(url = window.location.href, params = {}) {
        return new this.uri(url, params)

    }

    decimal(vv, vk) {
        return new decimal(vv, vk)
    }

    /**
     *
     * @param {ImgSrcStruct|AaImgSrc} obj
     * @param {ImageBase64|filepath} [thumbnail]
     * @param {File} [multipleFile]
     * @return {AaImgSrc}
     */
    imgSrc(obj, thumbnail, multipleFile) {
        if (obj instanceof AaImgSrc) {
            obj.setThumbnail(thumbnail)
            obj.setMultipleFile(multipleFile)
            return obj
        }
        return new AaImgSrc(obj, thumbnail, multipleFile)
    }

    /**
     * Apollo
     * @param {string } url
     * @param {(fp:string)=>void} fingerprintGenerator 设备唯一码生成器
     * @param {(data:{[key:string]:*})=>void} loginDataHandler 登录处理
     * @param {AaStorageEngine} [storage]
     * @return {AaApollo}
     */
    apollo(url, fingerprintGenerator, loginDataHandler, storage = this.storage.cookie) {
        return new AaApollo(this.fetch, url, fingerprintGenerator, loginDataHandler, storage)
    }

}


