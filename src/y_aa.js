class Aa {
    name = 'aa'


    // @type {AaRegistry}
    registry

    scrollEvent

    // @type {AaTX}
    TX = AaTX

    // @type {AaStorageFactor}
    storage
    cache
    db


    // @type {AaURI}
    uri = AaURI


    // @type {AaEnv}
    env = AaEnv


    // @type {AaAuth}
    auth


    // @type {AaFetch}
    fetch

    // @type {AaAuthOpenid}
    openidAuth

    // @type {AaAccount}
    account

    // @type {AaOSS}
    oss

    // @type {AaEditor}
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

    tx() {
        return new AaTX()
    }

    url(url = window.location.href, params = {}) {
        return new AaURI(url, params)

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
     * @param {string} url
     * @param {(fp:string)=>void} fingerprintGenerator 设备唯一码生成器
     * @param {(data:{[key:string]:*})=>void} loginDataHandler 登录处理
     * @param {AaStorageEngine} [storage]
     * @return {AaApollo}
     */
    apollo(url, fingerprintGenerator, loginDataHandler, storage = this.storage.cookie) {
        return new AaApollo(this.fetch, url, fingerprintGenerator, loginDataHandler, storage)
    }

}


