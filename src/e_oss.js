// @import _aaPath, _aaEnvironment, _aaAuth

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

    // aaFetch 层会处理该数据
    toJSON() {
        return this.path
    }


}


class AaImgSrc {
    name = 'aa-img-src'
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


    /**
     *
     * @param {string} path
     * @return {{path: (string|*), filetype: number, size: number, width: number, height: number}}
     */
    static parsePath(path) {
        const p = new _aaPath(path)
        let width = 0, size = 0, height = 0
        const a = p.filename.split('_')
        if (len(a) > 1 && len(a[0]) > 32 && len(a[1]) > 0) {
            size = parseInt(a[0].substring(32), 36)
            width = parseInt(a[1], 36)
            height = len(a) === 3 ? parseInt(a[2], 36) : width
        }

        return {
            path    : p.toString(),
            filetype: AaFileTypeEnum.parseImage(p.ext),
            size    : size,
            width   : width,
            height  : height,
        }
    }

    /**
     *
     * @param {{[key:string]:*}|string|HTMLElement} props
     */
    constructor(props) {
        this.init(props)
    }

    /**
     * @param {{[key:string]:*}} props
     */
    init(props) {
        map.overwrite(this, props, fmt.toCamelCase)
    }

    /**
     * Return the nearest size
     * @param {number} width
     * @param {number} [height]
     * @return {[number,number]}
     */
    #allowedSize(width, height = 0) {
        width = Math.ceil(width * window.devicePixelRatio)
        height = Math.ceil(height * window.devicePixelRatio)
        const allowed = this.allowed
        if (len(allowed) === 0) {
            if (width > 0 && height > 0) {
                return [width, height]
            }
            const ratio = this.width > 0 ? (this.height / this.width) : 0
            if (width === 0) {
                width = ratio === 0 ? height : Math.ceil(height / ratio)
            } else if (height === 0) {
                height = ratio === 0 ? width : Math.ceil(ratio * width)
            }
            return [width, height]
        }
        let matched = false
        let maxWidth = 0
        let maxHeight = 0
        let w = width
        let h = height

        for (let i = 0; i < allowed.length; i++) {
            const allowedWidth = Number(allowed[i][0])
            const allowedHeight = Number(allowed[i][1])
            if ((allowedWidth === width && allowedHeight === height) || (allowedWidth === width && height === 0) || (allowedHeight === height && width === 0)) {
                return [allowedWidth, allowedHeight]
            }

            if (!matched) {
                if (allowedWidth > maxWidth) {
                    maxWidth = allowedWidth
                    maxHeight = allowedHeight
                }
                // 首先找到比缩放比例大过需求的
                if (allowedWidth >= w && allowedHeight >= h) {
                    w = allowedWidth
                    h = allowedHeight
                    matched = true
                }
            } else {
                // 后面的都跟第一次匹配的比，找到最小匹配
                if (allowedWidth >= width && allowedWidth <= w && allowedHeight >= height && allowedHeight <= h) {
                    w = allowedWidth
                    h = allowedHeight
                }
            }
        }

        return matched ? [w, h] : [maxWidth, maxHeight]
    }

    /**
     * Crop image to the nearest size after resizing by window.devicePixelRatio
     * @param {number} width
     * @param {number} height
     * @return {{width: number, url: string, height: number, ratio: number}}
     */
    crop(width, height) {
        [width, height] = this.#allowedSize(width, height)
        const pattern = string(this.cropPattern)
        const url = pattern.replace(/\${WIDTH}/g, string(width)).replace(/\${HEIGHT}/g, string(height))
        return {
            width : width,
            height: height,
            ratio : width / height,
            url   : url,
        }
    }

    /**
     * Resize image to the nearest size after resizing by window.devicePixelRatio
     * @param {number|'MAX'|*} maxWidth
     * @return {{width: number, url: string, height: number, ratio: number}}
     */
    resize(maxWidth = MAX) {
        if (!maxWidth || maxWidth === MAX) {
            maxWidth = _aaEnvironment.maxWidth()
        }
        let [width, height] = this.#allowedSize(maxWidth)
        const pattern = string(this.resizePattern)
        const url = pattern.replace(/\${MAXWIDTH}/g, maxWidth)
        return {
            width : width,
            height: height,
            ratio : width / height,
            url   : url,
        }
    }

    // aaFetch 层会处理该数据
    toJSON() {
        return this.path
    }

}


class _aaOSS {
    name = 'aa-oss'

    constructor() {
    }


    /**
     * New AaImgSrc
     * @param {AaImgSrc|string|object} data
     * @return {AaImgSrc}
     */
    imgSrc(data) {
        if (data instanceof AaImgSrc) {
            return data
        }
        return new AaImgSrc(data)
    }
}