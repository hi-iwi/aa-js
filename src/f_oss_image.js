/**
 * @typedef {string} ImageBase64
 * @typedef {{width: number, url: string, height: number, ratio: decimal}} ImgResizedData
 * @typedef {string}test
 * @typedef {{path: string, filetype: number, size: number, provider: number, allowed: (number[][]|null), origin: string, width: number, crop_pattern: string, resize_pattern: string, height: number,thumbnail?: string,  multiple_file?: string}} ImgSrcStruct
 */
class _aaImgSrc {
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

    // @type {ImageBase64|filepath} for upload
    #thumbnail
    // @type {File} for upload
    #multipleFile

    setThumbnail(thumbnail) {
        this.#thumbnail = thumbnail
    }

    getThumbnail(width, height) {
        if (this.#thumbnail) {
            return this.#thumbnail
        }
        return this.crop(width, height).url
    }

    setMultipleFile(file) {
        this.#multipleFile = file
    }

    getMultipleFile(file) {
        return this.#multipleFile
    }

    /**
     * @param {ImgSrcStruct} props
     * @param {ImageBase64|filepath} [thumbnail]
     * @param {File} [multipleFile]
     */
    init(props, thumbnail, multipleFile) {
        if (arguments.length > 2) {
            props['thumbnail'] = thumbnail
            props['multipleFile'] = multipleFile
        }

        map.overwrite(this, props, key => {
            key = fmt.toCamelCase(key)
            if (['thumbnail', 'multipleFile'].includes(key)) {
                key = '#' + key
            }
            return key
        })
    }

    /**
     * @param {ImgSrcStruct} props
     * @param {ImageBase64|filepath} [thumbnail]
     * @param {File} [multipleFile]
     */
    constructor(props, thumbnail, multipleFile) {
        this.init(props, thumbnail, multipleFile)
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
     * @return {ImgResizedData}
     */
    crop(width, height) {
        [width, height] = this.#allowedSize(width, height)
        const pattern = string(this.cropPattern)
        const url = pattern.replace(/\${WIDTH}/g, string(width)).replace(/\${HEIGHT}/g, string(height))
        const ratio = decimal.div(width, height)
        return {
            width       : width,
            height      : height,
            ratio       : ratio,
            url         : url,
            originWidth : this.width,
            originHeight: this.height,
        }
    }

    /**
     * Resize image to the nearest size after resizing by window.devicePixelRatio
     * @param {number|MAX} [maxWidth]
     * @param {number} [maxHeight]
     * @return {ImgResizedData}
     */
    resize(maxWidth = MAX, maxHeight) {
        if (!maxWidth || maxWidth === MAX) {
            maxWidth = _aaEnvironment.maxWidth()
        }
        let [width, height] = this.#allowedSize(maxWidth)
        const ratio = decimal.div(width, height)
        if (maxHeight > 0 && height > maxHeight) {
            height = maxHeight
            width = ratio.beDiv(maxWidth)
        }

        const pattern = string(this.resizePattern)
        const url = pattern.replace(/\${MAXWIDTH}/g, maxWidth)
        return {
            width       : width,
            height      : height,
            ratio       : ratio,
            url         : url,
            originWidth : this.width,
            originHeight: this.height,
        }
    }

    /**
     * Get the original image, return resized if original image not exists
     * @return {ImgResizedData}
     */
    getOriginal() {
        if (!this.origin) {
            return this.resize(this.width, this.height)
        }
        const ratio = decimal.div(this.width, this.height)
        return {
            width         : this.width,
            height        : this.height,
            ratio         : ratio,
            url           : this.origin,
            originalWidth : this.width,
            originalHeight: this.height,
        }
    }

    // aaFetch 层会处理该数据
    toJSON() {
        return this.path
    }

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

}