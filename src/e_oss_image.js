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
     * @param {struct} props
     */
    init(props) {
        map.overwrite(this, props, fmt.toCamelCase)
    }

    /**
     *
     * @param {struct} props
     */
    constructor(props) {
        this.init(props)
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

class AaImgSrcUpload {
    name = 'aa-img-src-real-time'

    // @type {ImageBase64|path}
    thumbnail
    // @type AaImgSrc
    imgSrc
    file

    constructor(imgSrc, base64, file) {
        this.imgSrc = imgSrc instanceof AaImgSrc ? imgSrc : new AaImgSrc(imgSrc)
        this.base64 = base64
        this.file = file
    }

    // aaFetch 层会处理该数据
    toJSON() {
        return this.imgSrc ? this.imgSrc.path : ""
    }

}