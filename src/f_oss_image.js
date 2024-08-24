/**
 * @typedef {string} ImageBase64
 * @typedef {{path:string, filetype:number, size:number, provider:number, allowed:(number[][]|null), origin:string, width:number, crop_pattern:string, resize_pattern:string, height:number, thumbnail?:string, multiple_file?:string}} ImgSrcStruct
 * @typedef {{height:number, width:number, ratio:Decimal, realHeight:number, realWidth:number, originalHeight:number, originalWidth:number, url:string}} ImgResizedData
 */
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
     * @type {string|void}
     */
    jsonkey

    /** @type {ImageBase64|filepath} for upload */
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

    getMultipleFile(file) {
        return this.#multipleFile
    }

    getThumbnail(width, height, real = false) {
        if (this.#thumbnail) {
            return this.#thumbnail
        }
        if (real || !this.isValid()) {
            return void ""
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
     * @param {ImgSrcStruct|AaImgSrc|string|*} [data]
     * @param {ImageBase64|filepath} [thumbnail]
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
        return this.height ? Decimal.div(this.width, this.height) : decimal(0)
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
        r.url = string(this.cropPattern).replace(/\${WIDTH}/g, string(width)).replace(/\${HEIGHT}/g, string(height))
        return r
    }

    /**
     * Resize image to the closest size after resizing by window.devicePixelRatio
     * @param {number|MAX} [maxWidth]
     * @param {number} [maxHeight]
     * @return {ImgResizedData} 返回struct是最合适的，方便直接并入组件 state
     */
    resize(maxWidth = MAX, maxHeight) {
        if (!this.isValid()) {
            throw new TypeError(`invalid AaImgSrc`)
        }

        maxWidth = maxWidth === MAX || (!maxWidth && !maxHeight) ? AaEnv.maxWidth() : maths.pixel(maxWidth)
        maxHeight = maths.pixel(maxHeight)

        let rat = this.height > 0 ? this.width / this.height : 0
        if (rat) {
            if (maxWidth > this.width) {
                maxWidth = this.width
                if (!maxHeight || maxHeight >= this.height) {
                    maxHeight = this.height
                } else {
                    maxWidth = Math.ceil(maxHeight * rat)
                }
            } else if (maxHeight > this.height) {
                maxHeight = this.height
                if (!maxWidth || maxWidth >= this.width) {
                    maxWidth = this.width
                } else {
                    maxHeight = Math.ceil(maxWidth / rat)
                }
            }
        }


        let r = this.#allowedSize(maxWidth, maxHeight)
        if (!r.width) {
            log.error(`invalid resize size: ${maxWidth} * ${maxHeight}`)
        }
        r.originalHeight = this.height
        r.originalWidth = this.width
        r.url = string(this.resizePattern).replace(/\${MAXWIDTH}/g, maxWidth)
        return r
    }

    /**
     * Get the original image, return resized if original image not exists
     * @return {ImgResizedData|null} 返回struct是最合适的，方便直接并入组件 state
     */
    getOriginal() {
        if (!this.isValid()) {
            throw new TypeError(`invalid AaImgSrc`)
        }
        if (!this.origin) {
            return this.resize(this.width, this.height)
        }
        const ratio = Decimal.div(this.width, this.height)
        return {
            height        : this.height,
            width         : this.width,
            realHeight    : this.height,
            realWidth     : this.width,
            ratio         : ratio,
            originalHeight: this.height,
            originalWidth : this.width,
            url           : this.origin,
        }
    }

    /**
     * @param width
     * @param height
     * @param realWidth
     * @param realHeight
     * @return {{width:number, height:number,ratio:Decimal, realWidth:number, realHeight:number}}
     */
    #fillAllowedSize(width, height, realWidth, realHeight) {
        if (width > 0 && height > 0 && realWidth > 0 && realHeight > 0) {
            let ratio = Decimal.div(realHeight, realWidth)
            return {width, height, ratio, realWidth, realHeight,}
        }

        let ratio = this.ratio()
        if (ratio.value === 0 && realHeight) {
            ratio = Decimal.div(realWidth, realHeight)
        }
        if (ratio.value === 0 && height) {
            ratio = Decimal.div(width, height)
        }
        if (ratio.value === 0) {
            log.error(`invalid image size ${width} ${height}`)
            return {width, height, ratio, realWidth, realHeight}
        }

        ratio.rounder = Math.ceil
        if (width === 0) {
            width = ratio.multiply(height).toCeil()
        } else if (height === 0) {
            height = ratio.beDivided(width).toCeil()
        }
        if (realWidth === 0) {
            realWidth = ratio.multiply(realHeight).toCeil()
        } else if (realHeight === 0) {
            realHeight = ratio.beDivided(realWidth).toCeil()
        }
        if (width === 0 || height === 0 || realWidth === 0 || realHeight === 0) {
            log.error(`invalid image size ${width} ${height}`)
        }
        return {width, height, ratio, realWidth, realHeight}
    }

    /**
     * Return the closest size
     * @param {number} width
     * @param {number} [height]
     * @return {{width:number, height:number,ratio:Decimal, realWidth:number, realHeight:number}}
     */
    #allowedSize(width, height = 0) {
        width = maths.pixel(width)
        height = maths.pixel(height)
        let realWidth = Math.ceil(number(width) * AaEnv.devicePixelRatio())
        let realHeight = Math.ceil(number(height) * AaEnv.devicePixelRatio())

        if (this.width && realWidth > this.width) {
            realWidth = this.width
        }
        if (this.height && realHeight > this.height) {
            realHeight = this.height
        }

        const allowed = this.allowed
        if (len(allowed) === 0) {
            return this.#fillAllowedSize(width, height, realWidth, realHeight)
        }
        let matched = false
        let maxWidth = 0
        let maxHeight = 0
        let w = realWidth
        let h = realHeight

        for (let i = 0; i < allowed.length; i++) {
            const allowedWidth = maths.pixel(allowed[i][0])
            const allowedHeight = maths.pixel(allowed[i][1])
            if ((allowedWidth === realWidth && allowedHeight === realHeight) || (allowedWidth === realWidth && realHeight === 0) || (allowedHeight === realHeight && realWidth === 0)) {
                return this.#fillAllowedSize(width, height, allowedWidth, allowedHeight)
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
                if (allowedWidth >= realWidth && allowedWidth <= w && allowedHeight >= realHeight && allowedHeight <= h) {
                    w = allowedWidth
                    h = allowedHeight
                }
            }
        }
        return matched ? this.#fillAllowedSize(width, height, w, h) : this.#fillAllowedSize(width, height, maxWidth, maxHeight)
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
        const p = new paths(path)
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
     * @param {string} [url]
     * @return {ImgResizedData} 返回struct是最合适的，方便直接并入组件 state
     */
    static zeroResizedData(url) {
        return {
            height        : 0,
            width         : 0,
            realHeight    : 0,
            realWidth     : 0,
            ratio         : decimal(0),
            originalHeight: 0,
            originalWidth : 0,
            url           : string(url),
        }
    }

}