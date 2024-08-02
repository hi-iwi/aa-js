class Aa {
    name = 'aa'


    /** @type {AaRegistry} */
    registry

    scrollEvent

    /** @type {AaStorageFactor} */
    storage
    cache
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

    mselects(opts, cast, inherit = false){
        return new AaMultiLevelSelects(...arguments)
    }
    url(url = window.location.href, params = {}) {
        return new AaURI(url, params)
    }

    /**
     *
     * @param {ImgSrcStruct|AaImgSrc|string|*} [data]
     * @param {ImageBase64|filepath} [thumbnail]
     * @param {File} [multipleFile]
     * @return {AaImgSrc}
     */
    imgSrc(data, thumbnail, multipleFile) {
        if (data instanceof AaImgSrc) {
            data.setThumbnail(thumbnail)
            data.setMultipleFile(multipleFile)
            return data
        }
        return new AaImgSrc(...arguments)
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

    /**
     * @param {TimeParam} [timeA] default to now()
     * @param {TimeParam} [timeB] default to now()
     */
    timeDiff(timeA, timeB) {
        new Date()
    }

}


