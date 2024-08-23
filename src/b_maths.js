/**
 * Special Mathematics
 * @import atype
 * @typedef  {string|NumberX|{[key:NumberX]:ResponsiveSize}} ResponsiveSize
 */

class maths {
    name = 'aa-maths'

    /**
     * Get the value of the closest key in a setting
     * @param {struct} settings
     * @param {ComparisonSymbol} symbol
     *      >           the closest and greater value
     *      <           the closest and lesser value
     *      = or ==     the closest value, may be lesser, equal to or greater
     *      >=          the closest and greater value or equal value
     *      <=          the closest and lesser value or equal value
     * @param {number} value
     * @return {*}
     */
    static closestSetting(settings, symbol, value) {
        let keys = Object.keys(settings)
        keys.sort() // Ascending order 字符串和数字都一样能排序
        value = number(value)

        const key = mathn.closest(keys, symbol, value)
        if (typeof key !== "undefined") {
            return settings[key]
        }

        return void 0
    }

    /**
     * Format bytes to B/KB/MB/GB/TB/PB/EB/ZB/YB
     * @param {number} bytes
     * @param {number} decimals
     * @returns {[number, string]}
     */
    static formatBytes(bytes, decimals = 0) {
        if (!+bytes) {
            return [0, 'B']
        }
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return [parseFloat((bytes / Math.pow(k, i)).toFixed(dm)), sizes[i]]
    }


    /**
     * Get the closest width matches to settings
     * @param {ResponsiveSize} maxHeight
     * @param {ResponsiveSize} [wrapperHeight]
     * @return {number}
     */
    static maxHeight(maxHeight, wrapperHeight) {
        let value = maxHeight
        // @example {320:"5rem", 640:1080, 1280: 2048}
        if (atype.isStruct(maxHeight)) {
            value = maths.closestSetting(maxHeight, '<=', value)
        }
        return maths.pixel(value ? value : wrapperHeight)
    }

    /**
     * Get the closest width matches to settings
     * @param {ResponsiveSize} value
     * @param {ResponsiveSize} [wrapperWidth]
     * @return {number}
     */
    static pixelRelative(value, wrapperWidth) {
        wrapperWidth = !wrapperWidth ? AaEnv.maxWidth() : maths.pixel(wrapperWidth)

        // @example {320:"5rem", 640:1080, 1280: 2048}
        if (typeof value === 'object') {
            return maths.closestSetting(value, '<=', wrapperWidth)
        }

        // @example 20%  .5%
        if (typeof value === "string" && /^[\d.]+%$/.test(value)) {
            return Math.floor(wrapperWidth * parseFloat(value) / 100)
        }
        return maths.pixel(value ? value : wrapperWidth)
    }

    /**
     * Convert responsive size to pixel, now support rem only.
     * @param {ResponsiveSize} vv
     * @param {string} [vk]
     * @param {ResponsiveSize} [defaultV]
     * @return {number}
     */
    static pixel(vv, vk, defaultV) {
        vv = defval(...arguments)
        if (!vv) {
            return 0
        }
        if (typeof vv === "number") {
            return Math.floor(vv)
        }
        vv = string(vv).replace(/\s/g, '').toLowerCase()
        if (vv.indexOf("rem") > -1) {
            // 计算1rem对应px
            const rem = parseFloat(window.getComputedStyle(document.documentElement)["fontSize"])  // 1rem 对应像素
            return Math.floor(number(vv.replace("rem", '')) * rem)
        }
        return Math.floor(number(vv))
    }

    /**
     * 千分位表示法
     * @param {NumberX} num
     * @param {number} n
     * @param {string} separator
     * @returns {string}
     */
    static thousands(num, n = 3, separator = ',') {
        num = String(num)
        if (!n || !separator || num.length <= n) {
            return num
        }
        const neg = num[0] === '-' ? 1 : 0
        let s2 = ""
        let j = 0
        for (let i = num.length - 1; i >= neg; i--) {
            if (j > 0 && j % n === 0) {
                s2 = separator + s2
            }
            s2 = num[i] + s2
            j++
        }
        return s2
    }
}