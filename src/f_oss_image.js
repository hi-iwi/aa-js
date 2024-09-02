/** @typedef {{path:string, filetype:number, size:number, provider:number, allowed:?number[][], origin:string, width:number, crop_pattern:string, resize_pattern:string, height:number, thumbnail?:string, multiple_file?:string}} ImgSrcStruct */
/** @typedef {{height:number, width:number, ratio:number, imageHeight:number, imageWidth:number, originalHeight:number, originalWidth:number, url:string}} ImageResizedData */

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
    /** @type {number} */
    #cropDpr = 1
    /** @type {number} */
    #fitDpr = 1
    /** @type {number} */
    #ratio = 0

    get ratio() {
        return this.#ratio
    }

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

        this.#ratio = this.height ? this.width / this.height : 0

        let dpr = AaEnv.devicePixelRatio()
        let sizePixelRatio = this.size ? this.width * this.height / this.size : 0
        if (sizePixelRatio > 0) {
            dpr *= sizePixelRatio / 5  // 单纯使用DPR暂时尝试 比例 5
        }
        this.#cropDpr = dpr
        this.#fitDpr = AaEnv.devicePixelRatio()
    }


    /**
     * Crop image to the closest size after resizing by window.devicePixelRatio
     * @param {number} width
     * @param {number} height
     * @return {ImageResizedData} 返回struct是最合适的，方便直接并入组件 state
     * @note 由于allowed限制，一般取不到完全完全一致的width/height，因此都是取近似尺寸
     */
    crop(width, height) {
        if (!this.isValid()) {
            throw new TypeError(`invalid AaImgSrc`)
        }
        const dpr = this.#cropDpr
        const imageWidth = Math.ceil(dpr * width)
        // 暂定1.5倍
        if (this.origin && imageWidth * 1.5 > this.width) {
            return {
                height        : height,
                imageHeight   : this.height,
                imageWidth    : this.width,
                originalHeight: this.height,
                originalWidth : this.width,
                url           : this.origin,
                ratio         : this.#ratio,
                width         : width,
            }
        }

        const imageHeight = Math.ceil(height * dpr)
        let d = this.#allowedSize(width, height, imageWidth, imageHeight)
        let url = this.cropPattern.replaceAll({
            "${WIDTH}" : d.imageWidth,
            "${HEIGHT}": d.imageHeight,
        })
        return {
            height        : d.height,
            imageHeight   : d.imageHeight,
            imageWidth    : d.imageWidth,
            originalHeight: this.height,
            originalWidth : this.width,
            ratio         : d.ratio,
            url           : url,
            width         : d.width,
        }
    }

    /**
     * Stretch the image fit to the maxWidth
     * @param {number|MAX} maxWidth
     * @return {ImageResizedData} 返回struct是最合适的，方便直接并入组件 state
     * @note 由于allowed限制，一般取不到完全完全一致的width/height，因此都是取近似尺寸
     */
    fit(maxWidth = MAX) {
        if (!this.isValid()) {
            throw new TypeError(`invalid AaImgSrc`)
        }
        if (maxWidth && maxWidth !== MAX) {
            maxWidth = maths.pixel(maxWidth)
        }
        if (!maxWidth || maxWidth === MAX) {
            maxWidth = AaEnv.maxWidth()
        }
        const dpr = this.#fitDpr
        const ratio = this.#ratio
        let imageWidth = maxWidth * dpr
        if (imageWidth > this.width) {
            imageWidth = this.width
            maxWidth = Math.floor(imageWidth / dpr)
        }
        const height = Math.ceil(maxWidth / ratio)
        const imageHeight = Math.ceil(height * dpr)

        // 暂定1.5倍
        if (this.origin && imageWidth * 1.5 > this.width) {
            return {
                height        : height,
                imageHeight   : this.height,
                imageWidth    : this.width,
                originalHeight: this.height,
                originalWidth : this.width,
                url           : this.origin,
                ratio         : ratio,
                width         : maxWidth,
            }
        }

        let d = this.#allowedSize(maxWidth, height, imageWidth, imageHeight)
        if (!d.width) {
            log.error(`invalid resize max width: ${maxWidth}`)
        }

        let url = this.origin
        if (!url || d.imageWidth !== this.width) {
            url = this.resizePattern.replaceAll("${MAXWIDTH}", d.imageWidth)
        }
        return {
            height        : d.height,
            imageHeight   : d.imageHeight,
            imageWidth    : d.imageWidth,
            originalHeight: this.height,
            originalWidth : this.width,
            ratio         : d.ratio,
            url           : url,
            width         : d.width,
        }
    }


    /**
     * Return the closest size
     * @param {number} width
     * @param {number} height
     * @param {number} imageWidth
     * @param {number} imageHeight
     * @return {{width:number, height:number,ratio:number, imageWidth:number, imageHeight:number}}
     */
    #allowedSize(width, height, imageWidth, imageHeight) {
        const ratio = this.#ratio

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
     * @return {ImageResizedData} 返回struct是最合适的，方便直接并入组件 state
     */
    static zeroResizedData(url) {
        return {
            height        : 0,
            width         : 0,
            imageHeight   : 0,
            imageWidth    : 0,
            ratio         : 0,
            originalHeight: 0,
            originalWidth : 0,
            url           : string(url),
        }
    }
}