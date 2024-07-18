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


class AaImgSrc {
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
        const x = path.indexOf('//')
        if (x > -1) {
            let u = new URL(x === 0 ? location.protocol + path : path)
            path = u.pathname
        }

        const p = new _aaPath(path)
        let width = 0, size = 0, height = 0
        const a = p.filename.split('_')
        if (len(a) > 1 && len(a[0]) > 32 && len(a[1]) > 0) {
            size = parseInt(a[0].substring(32), 36)
            width = parseInt(a[1], 36)
            height = len(a) === 3 ? parseInt(a[2], 36) : width
        }
        this.#providerHandler({})

    }

    /**
     *
     * @param {{[key:string]:*}|string|HTMLElement} props
     * @param {function(path:string):int} [providerHandler]
     */
    constructor(props, providerHandler = nif) {
        this.#providerHandler = providerHandler
        this.load(props)
    }

    /**
     *
     * @param {{[key:string]:*}|string|HTMLElement} props
     */
    load(props) {
        const type = atype.of(props)
        if (type === atype.struct) {
            map.overwrite(this, props)
            return
        }
        props = type === atype.dom ? props.dataset.path : props
        if (type === atype.string) {
            this.#parsePath(props)
            return
        }

        throw new RangeError("invalid AaImgSrc props")
    }

    /**
     * Return cropped image URL
     * @param width
     * @param height
     * @return {string|*}
     */
    crop(width, height) {
        width = int32(width)
        height = int32(height)
        const rw = this.width
        const rh = this.height
        if (width >= rw && height >= rh) {
            return this.origin
        }
        if (len(this.allowed) > 0) {
            const allowed = this.allowed
            let matched = false
            let found = false
            let mw = 0
            let mh = 0
            let w = width
            let h = height

            for (let i = 0; i < allowed.length; i++) {
                let a = allowed[i]
                let aw = int32(a[0])
                let ah = int32(a[1])
                if (aw === width && ah === height) {
                    found = true
                    break
                }
                if (!matched) {
                    if (aw > mw) {
                        mw = aw
                        mh = ah
                    }
                    // 首先找到比缩放比例大过需求的
                    if (aw >= w && a[1] >= h) {
                        w = aw
                        h = ah
                        matched = true
                    }
                } else {
                    // 后面的都跟第一次匹配的比，找到最小匹配
                    if (aw >= width && aw <= w && ah >= height && ah <= h) {
                        w = aw
                        h = ah
                    }
                }
            }
            if (!found) {
                if (!matched) {
                    width = mw
                    height = mh
                } else {
                    width = w
                    height = h
                }
            }
        }
        return this.cropPattern.replace(/\${WIDTH}/g, width).replace(/\${HEIGHT}/g, height)
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
        return new AaImgSrc(data, this.providerHandler)
    }
}