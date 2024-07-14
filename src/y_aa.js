class Aa {
    // a_
    uri = _aaUri
    math = _aaMath
    // b_
    env= new _aaEnv(_aaUri)
    // c_
    storage = new _aaStorage()

    constructor() {

    }


    date() {
        return new _aaDate(...arguments)
    }

    /**
     * URL
     * @param url
     * @param params
     * @returns {_aaUrl}
     */
    url(url = window.location.href, params = {}) {
        return new _aaUrl(url, params)
    }

    /**
     * Fetch
     * @returns {_aaFetch}
     */
    fetch() {
        return new _aaFetch()
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
        return new _aaApollo(this.fetch(), url, fingerprintGenerator, loginDataHandler, storageGetter, storageSetter)
    }


    vuser() {

    }
}


