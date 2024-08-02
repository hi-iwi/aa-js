/**
 * Special Mathematics
 * @import atype
 * @typedef  {string|NumberX} ResponsiveSize
 */

class maths {
    name = 'aa-maths'

    /**
     * Convert responsive size to pixel, now support rem only.
     * @param {ResponsiveSize|struct} vv
     * @param {string} [vk]
     * @param {ResponsiveSize|struct} [defaultV]
     * @return {number}
     */
    static pixel(vv, vk, defaultV) {
        vv = defval(...arguments)
        if (vv === null) {
            return 0
        }
        if (typeof vv === "number") {
            return Math.floor(vv)
        }
        vv = string(vv).replace(/\s/g, '').toLowerCase()
        if (vv.indexOf("rem") > -1) {
            // 计算1rem对应px
            const rem = parseFloat(window.getComputedStyle(document.documentElement)["fontSize"])  // 1rem 对应像素
            return Math.floor(float32(vv.replace("rem", '')) * rem)
        }
        return Math.floor(float32(vv))
    }


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
     * Get the closest width matches to settings
     * @param {ResponsiveSize|struct} settings
     * @param {ResponsiveSize} [maxWidth]
     * @return {number}
     */
    static maxWidth(settings, maxWidth) {
        if (!maxWidth) {
            maxWidth = AaEnv.maxWidth()
        }
        let value = 0

        // @example {320:"5rem", 640:1080, 1280: 2048}
        if (atype.isStruct(settings)) {
            value = maths.closestSetting(settings, '<=', value)
        }
        if (!value) {
            value = maxWidth
        }
        // @example 20%
        if (typeof value === "string" && value.indexOf('%') > 0) {
            value = value.replace(/\s/g, '')
            return Math.floor(maxWidth * parseFloat(value) / 100)
        }
        return maths.pixel(value)
    }

    /**
     * Get the closest width matches to settings
     * @param {ResponsiveSize|struct} settings
     * @param {ResponsiveSize} [maxHeight]
     * @return {number}
     */
    static maxHeight(settings, maxHeight) {
        let value = 0
        // @example {320:"5rem", 640:1080, 1280: 2048}
        if (atype.isStruct(settings)) {
            value = maths.closestSetting(settings, '<=', value)
        }
        if (!value) {
            value = maxHeight
        }
        return maths.pixel(value)
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