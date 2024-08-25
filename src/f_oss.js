/**
 * @import AaPath, AaEnv, AaAuth
 */
// filetype 统一了，方便客户端分析 path/filetype 结构类型。也方便客户端上传的格式符合标准格式。
// .3pg 既是音频文件，也是视频文件。因此，不能单纯通过后缀知晓文件类型。需要客户端上传的时候预先知道是音频或视频。
const AaFileTypeEnum = {
    UnknownType: 0,

    // 图片类型范围：1-999
    Jpeg      : 1,
    Png       : 2,
    Gif       : 3,
    Webp      : 4,
    Heic      : 5,// iPhone 拍摄的照片
    OtherImage: 999,

    // 音频类型范围：1000-1999
    Mp3       : 1000,
    X3pg      : 1001,
    X3pg2     : 1002,
    Aiff      : 1003,
    AudioWebm : 1004,
    AudioWav  : 1005,
    OtherAudio: 1999,

    // 视频范围：2000-2999
    Avi       : 2000,
    Mov       : 2001, // Apple QuickTime
    Mpeg      : 2002,
    Mp4       : 2003,// MPEG-4
    X3gp      : 2004,
    X3gp2     : 2005,
    Webm      : 2006,
    Wav       : 2007,
    OtherVideo: 2999,

    // @param {number}filetype
    isImage: filetype => filetype >= AaFileTypeEnum.Jpeg && filetype <= AaFileTypeEnum.OtherImage,
    isAudio: filetype => filetype >= AaFileTypeEnum.Mp3 && filetype <= AaFileTypeEnum.OtherAudio,
    isVideo: filetype => filetype >= AaFileTypeEnum.Avi && filetype <= AaFileTypeEnum.OtherVideo,
    parse  : function () {

    },
    /**
     * Get image file type via video file extension or mime-type
     * @param {string} mime
     * @return {number}
     */
    parseImage: function (mime) {
        mime = strings.trimStart(string(mime).toLowerCase(), '.', 1)
        if (["jpg", "jpeg", "image/jpeg"].includes(mime)) {
            return AaFileTypeEnum.Jpeg
        }
        if (["png", "image/png"].includes(mime)) {
            return AaFileTypeEnum.Png
        }
        if (["gif", "image/gif"].includes(mime)) {
            return AaFileTypeEnum.Gif
        }
        if (["webp", "image/webp"].includes(mime)) {
            return AaFileTypeEnum.Webp
        }
        if (["heic", "image/heic", "heif", "image/heif"].includes(mime)) {
            return AaFileTypeEnum.Heic
        }

        return AaFileTypeEnum.OtherImage
    },
    /**
     * Get audio file type via video file extension or mime-type
     * @param {string} mime
     * @return {number}
     */
    parseAudio: function (mime) {
        mime = strings.trimStart(string(mime).toLowerCase(), '.', 1)
        if (["mp3", "audio/mpeg"].includes(mime)) {
            return AaFileTypeEnum.Mp3
        }
        if (["3gp", "audio/3gpp"].includes(mime)) {
            return AaFileTypeEnum.X3pg
        }

        if (["3g2", "audio/3gpp2"].includes(mime)) {
            return AaFileTypeEnum.X3pg2
        }

        if (["aiff", "aif", "aifc", "audio/x-aiff"].includes(mime)) {
            return AaFileTypeEnum.Aiff
        }
        return AaFileTypeEnum.OtherAudio
    },
    /**
     * Get video file type via video file extension or mime-type
     * @param {string} mime
     * @return {number}
     */
    parseVideo: function (mime) {
        mime = strings.trimStart(string(mime).toLowerCase(), '.', 1)

        if (["avi", "video/x-msvideo"].includes(mime)) {
            return AaFileTypeEnum.Avi
        }

        if (["mov", "video/quicktime"].includes(mime)) {
            return AaFileTypeEnum.Mov
        }
        if (["mpeg", "video/mpeg"].includes(mime)) {
            return AaFileTypeEnum.Mpeg
        }
        if (["mp4", "video/mp4"].includes(mime)) {
            return AaFileTypeEnum.Mp4
        }
        if (["3gp", "video/3gpp"].includes(mime)) {
            return AaFileTypeEnum.X3gp
        }
        if (["3g2", "video/3gpp2"].includes(mime)) {
            return AaFileTypeEnum.X3gp2
        }
        if (["webm", "video/webm"].includes(mime)) {
            return AaFileTypeEnum.Webm
        }
        if (["wav", "video/x-wav"].includes(mime)) {
            return AaFileTypeEnum.Wav
        }
        return AaFileTypeEnum.OtherVideo
    },

}

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
     * @param {Stringable} str
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
     * @param {ImageBase64|filepath} [thumbnail]
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