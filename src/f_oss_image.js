/** @typedef {{path:string, filetype:number, size:number, provider:number, allowed:?number[][], origin:string, width:number, crop_pattern:string, resize_pattern:string, height:number, thumbnail?:string, multiple_file?:string}} ImgSrcStruct */
/** @typedef {{height:number, width:number, ratio:Decimal, imageHeight:number, imageWidth:number, originalHeight:number, originalWidth:number, url:string}} ImgResizedData */

class AaImgSrc extends AaSrc {
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
     * @override
     * @type {string|undefined}
     */
    jsonkey

    /** @type {Base64|Path} for upload */
    #thumbnail
    /** @type {File} for upload */
    #multipleFile

    /**
     * @override
     * @return {{path, filetype, size, provider, allowed, jsonkey, origin, width, crop_pattern, resize_pattern, height}}
     */
    data() {
        return {
            'provider'      : this.provider,
            'crop_pattern'  : this.cropPattern,
            'resize_pattern': this.resizePattern,
            'origin'        : this.origin,
            'path'          : this.path,
            'filetype'      : this.filetype,
            'size'          : this.size,
            'width'         : this.width,
            'height'        : this.height,
            'allowed'       : this.allowed,
            'jsonkey'       : this.jsonkey,
        }
    }

    getMultipleFile() {
        return this.#multipleFile
    }

    /**
     *
     * @param {number} [width]
     * @param {number} [height]
     * @param {boolean} [real]
     * @return {Base64|Path|undefined}
     */
    getThumbnail(width, height, real = false) {
        if (this.#thumbnail) {
            return this.#thumbnail
        }
        if (real || !this.isValid()) {
            return undefined
        }
        return this.crop(width, height).url
    }

    isValid() {
        return this.path && this.cropPattern && this.resizePattern
    }

    setMultipleFile(file) {
        this.#multipleFile = file
    }

    setThumbnail(thumbnail) {
        this.#thumbnail = thumbnail
    }


    /**
     * @param {ImgSrcStruct|AaImgSrc|Path|*} [data]
     * @param {Base64|Path} [thumbnail]
     * @param {File} [multipleFile]
     * @note 由于 construct 返回null是无效的，这里对无效的直接返回null
     */
    constructor(data, thumbnail, multipleFile) {
        super()
        map.overwrite(this, data, key => {
            key = fmt.toCamelCase(key)
            if (['thumbnail', 'multipleFile'].includes(key)) {
                key = '#' + key
            }
            return key
        })

        this.#thumbnail = thumbnail
        this.#multipleFile = multipleFile
    }

    /**
     * Get Ratio of width/height
     * @return {Decimal}
     */
    ratio() {
        return this.height ? Decimal.divideReal(this.width, this.height) : decimal(0)
    }

    /**
     * Crop image to the closest size after resizing by window.devicePixelRatio
     * @param {number} width
     * @param {number} height
     * @return {ImgResizedData} 返回struct是最合适的，方便直接并入组件 state
     */
    crop(width, height) {
        if (!this.isValid()) {
            throw new TypeError(`invalid AaImgSrc`)
        }
        let r = this.#allowedSize(width, height)
        if (!r.width || !r.height) {
            log.error(`invalid crop size: ${width} * ${height}`)
        }
        r.originalHeight = this.height
        r.originalWidth = this.width
        r.url = this.cropPattern.replaceAll({
            "${WIDTH}" : r.imageWidth,
            "${HEIGHT}": r.imageHeight,
        })
        return r
    }

    /**
     * Resize image to the closest size after resizing by window.devicePixelRatio
     * @param {number|MAX} [maxWidth]
     * @return {ImgResizedData} 返回struct是最合适的，方便直接并入组件 state
     */
    resize(maxWidth = MAX) {
        if (!this.isValid()) {
            throw new TypeError(`invalid AaImgSrc`)
        }
        if (maxWidth !== MAX && maxWidth) {

        }
        maxWidth = maths.pixel(maxWidth)
        if (!maxWidth) {
            maxWidth = AaEnv.maxWidth()
        }
        const dpr = AaEnv.devicePixelRatio()
        let imageWidth = maxWidth * dpr
        if (this.width > 0 && imageWidth > this.width) {
            imageWidth = this.width
            maxWidth = Math.floor(imageWidth / dpr)
        }

        let r = this.#allowedSize(maxWidth)
        if (!r.width) {
            log.error(`invalid resize max width: ${maxWidth}`)
        }
        r.originalHeight = this.height
        r.originalWidth = this.width
        r.url = this.resizePattern.replaceAll("${MAXWIDTH}", r.imageWidth)

        return r
    }

    /**
     * Get the original image, return resized if original image not exists
     * @return {?ImgResizedData} 返回struct是最合适的，方便直接并入组件 state
     */
    getOriginal() {
        if (!this.isValid()) {
            throw new TypeError(`invalid AaImgSrc`)
        }
        if (!this.origin) {
            return this.resize(this.width)
        }
        const ratio = Decimal.divideReal(this.width, this.height)
        return {
            height        : this.height,
            width         : this.width,
            imageHeight   : this.height,
            imageWidth    : this.width,
            ratio         : ratio,
            originalHeight: this.height,
            originalWidth : this.width,
            url           : this.origin,
        }
    }


    /**
     * Return the closest size
     * @param {number} width
     * @param {number} [height]
     * @return {{width:number, height:number,ratio:Decimal, imageWidth:number, imageHeight:number}}
     */
    #allowedSize(width, height = 0) {
        const dpr = AaEnv.devicePixelRatio()
        const ratio = this.ratio()
        width = maths.pixel(width)
        if (!width) {
            width = AaEnv.maxWidth()
        }
        height = !height ? 0 : maths.pixel(height)
        if (!height) {
            height = ratio.clone().beDividedInt(width).toCeil()
        }
        let imageWidth = Math.ceil(width * dpr)  // width*dpr，最大不超过实际宽度
        let imageHeight = Math.ceil(height * dpr)

        if (this.width && imageWidth > this.width) {
            imageWidth = this.width
        }
        if (this.height && imageHeight > this.height) {
            imageHeight = this.height
        }

        const allowed = this.allowed
        if (len(allowed) === 0) {
            return {width, height, ratio, imageWidth, imageHeight}
        }
        let matched = false
        let maxWidth = 0
        let maxHeight = 0
        let w = imageWidth
        let h = imageHeight

        for (let i = 0; i < allowed.length; i++) {
            const allowedWidth = maths.pixel(allowed[i][0])
            const allowedHeight = maths.pixel(allowed[i][1])
            if (allowedWidth === imageWidth && allowedHeight === imageHeight) {
                return {width, height, ratio, imageWidth, imageHeight}
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
                if (allowedWidth >= imageWidth && allowedWidth <= w && allowedHeight >= imageHeight && allowedHeight <= h) {
                    w = allowedWidth
                    h = allowedHeight
                }
            }
        }

        return matched ? {width, height, ratio, imageWidth: w, imageHeight: h} : {
            width,
            height,
            ratio,
            imageWidth : maxWidth,
            imageHeight: maxHeight
        }
    }

    /**
     * @override
     * @param {ImgSrcStruct} data
     * @return {*}
     */
    static isDataValid(data) {
        return data && data['path'] && data['crop_pattern'] && data['resize_pattern']
    }

    /**
     * @param {string} path
     * @return {{path: (string|*), filetype: number, size: number, width: number, height: number}}
     */
    static parsePath(path) {
        const p = new AaPath(path)
        let width = 0, size = 0, height = 0
        const a = p.filename.split('_')
        if (len(a) > 1 && len(a[0]) > 32 && len(a[1]) > 0) {
            size = parseInt(a[0].substring(32), 36)
            width = parseInt(a[1], 36)
            height = len(a) === 3 ? parseInt(a[2], 36) : width
        }
        return {
            path    : p.toString().trimStart('/'),
            filetype: new AaFileType(p.ext).valueOf(),
            size    : size,
            width   : width,
            height  : height,
        }
    }

    /**
     * @param {string} [url]
     * @return {ImgResizedData} 返回struct是最合适的，方便直接并入组件 state
     */
    static zeroResizedData(url) {
        return {
            height        : 0,
            width         : 0,
            imageHeight   : 0,
            imageWidth    : 0,
            ratio         : decimal(0),
            originalHeight: 0,
            originalWidth : 0,
            url           : string(url),
        }
    }
}