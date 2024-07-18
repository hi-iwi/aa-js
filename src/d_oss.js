// import _aaPath

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
        mime = string(mime).toLowerCase().replace(/^\./, '')
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
        mime = string(mime).toLowerCase().replace(/^\./, '')
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
        mime = string(mime).toLowerCase().replace(/^\./, '')

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

class _aaFileSrc {
    name = 'aa-file-src'
    process
    path
    filetype
    ext
    size
    width
    height
    allowed


}


class _aaImgSrc {
    name = 'aa-img-src'
    // @property {function(path:string)=>int}
    #providerHandler
    // @property {int}
    provider
    cropPattern
    resizePattern
    origin
    path
    filetype
    size
    width
    height
    allowed

    #parsePath(path) {
        const p = new _aaPath(path)
        let width = 0, size = 0, height = 0
        const a = p.filename.split('_')
        if (len(a) > 1 && len(a[0]) > 32 && len(a[1]) > 0) {
            size = parseInt(a[0].substring(32), 36)
            width = parseInt(a[1], 36)
            height = len(a) === 3 ? parseInt(a[2], 36) : width
        }

        return {
            //provider: this.#providerHandler(p),
            path    : path,
            filetype: AaFileTypeEnum.parseImage(p.ext),
            size    : size,
            width   : width,
            height  : height,
        }
    }

    /**
     *
     * @param {string|{[key:string]:*}} props
     * @param {function(path:string):int} [providerHandler]
     */
    constructor(props, providerHandler = nif) {
        this.#providerHandler = providerHandler
        return this.load(props)
    }

    /**
     *
     * @param {string|{[key:string]:*}} data
     */
    load(data) {
        if (!data) {
            throw new RangeError("invalid AaImgSrc props")
        }
        if (typeof data === "string") {
            this.#parsePath(data)
            return
        }
        if (atype.isStruct(data)) {
            map.overwrite(this, data)
            return
        }
        throw new RangeError("invalid AaImgSrc props")
    }


}


class _aaOSS {
    name = 'aa-oss'
    providerHandler


    constructor(processorParser) {
    }

    load() {

    }

    imgSrc(data) {
        return new _aaImgSrc(data, this.providerHandler)
    }
}