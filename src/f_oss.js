/**
 * @import AaPath, AaEnv, AaAuth
 */
// filetype 统一了，方便客户端分析 path/filetype 结构类型。也方便客户端上传的格式符合标准格式。
// .3pg 既是音频文件，也是视频文件。因此，不能单纯通过后缀知晓文件类型。需要客户端上传的时候预先知道是音频或视频。


class AaSrc {
    jsonkey

    constructor() {
    }

    data() {
        return {}
    }

    serialize() {
        return strings.json(this.data())
    }

    // aaFetch 层会处理该数据
    toJSON() {
        let key = this.jsonkey && this.hasOwnProperty(this.jsonkey) ? this.jsonkey : 'path'
        return this[key]
    }

    static isDataValid(data) {
        return true
    }

    /**
     * @param {str} str
     * @return {AaImgSrc|null}
     * @note compatible with this.serialize()
     */
    static unserialize(str) {
        const self = this   // 使用 this （不能用 this.constructor()). 可以传递到子类
        let data = strings.unjson(str)
        if (!self.isDataValid(data)) {
            return null
        }
        return new AaImgSrc(data)
    }
}


class AaOSS {
    name = 'aa-oss'

    #svc
    #assetLibHandler
    #assetHandler


    initSvc(svc) {
        this.#svc = svc
    }

    initAssetLibHandler(handler) {
        this.#assetLibHandler = handler
    }


    initAssetHandler(handler) {
        this.#assetHandler = handler
    }


    constructor() {
    }

    assetLib(path) {
        return typeof this.#assetLibHandler === "function" ? this.#assetLibHandler(path) : path
    }

    asset(path) {
        if (this.#svc) {
            path = paths.join(string(this.#svc), path)
        }
        return typeof this.#assetHandler === "function" ? this.#assetHandler(path) : path
    }

    // asset image/font
    i(path) {
        return this.asset("/i/" + path)
    }

    // asset script
    x(path) {
        return this.asset("/x/" + path)
    }

    /**
     *
     * @param {ImgSrcStruct|AaImgSrc} [data]
     * @param {Base64|Path} [thumbnail]
     * @param {File} [multipleFile]
     * @return {AaImgSrc|null}
     */
    imgSrc(data, thumbnail, multipleFile) {
        if (data instanceof AaImgSrc) {
            data.setThumbnail(thumbnail)
            data.setMultipleFile(multipleFile)
            return data
        }
        if (!AaImgSrc.isDataValid(data)) {
            return null
        }

        return new AaImgSrc(...arguments)
    }
}