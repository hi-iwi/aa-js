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
            return maths.pixel(settings[key])
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
     * Convert responsive size to pixel, now support rem only.
     * @param {ResponsiveSize} vv
     * @param {string} [vk]
     * @param {ResponsiveSize} [defaultV]
     * @param {ResponsiveSize} [relativeBase]
     * @return {number}
     * @example
     *  maths.pixel(100) = maths.pixel("100 PX") = maths.pixel("100px")   ===> 100
     *  maths.pixel("1rem")   ===> rem to pixel
     *  maths.pixel({767:"1rem", 768:"2rem"}) = maths.pixel({767:"1rem", 768:"2rem"}, void '', void 0, AaEnv.maxWidth())
     *  maths.pixel("20%") = maths.pixel("20%", void '', void 0, AaEnv.maxWidth())
     */
    static pixel(vv, vk, defaultV, relativeBase) {
        vv = defval(...arguments)
        if (!vv) {
            return 0
        }
        if (typeof vv === "number") {
            return Math.floor(vv)
        }

        const isSettings = typeof vv === 'object'       // @example {320:"5rem", 640:1080, 1280: 2048}
        let isRelative = false  // @example 20%  .5%

        if (typeof vv === 'string') {
            vv = strings.replaceAll(vv, ' ', '').toLowerCase()
            isRelative = /^[\d.]+%$/.test(vv)
        }

        if (isSettings || isRelative) {
            relativeBase = !relativeBase ? AaEnv.maxWidth() : maths.pixel(relativeBase)
            return isSettings ? maths.closestSetting(vv, '<=', relativeBase) : Math.floor(relativeBase * parseFloat(vv) / 100)
        }

        if (vv.indexOf("rem") > -1) {
            // 计算1rem对应px
            const rem = parseFloat(window.getComputedStyle(document.documentElement)["fontSize"])  // 1rem 对应像素
            return Math.floor(Number(strings.trimEnd(vv, "rem")) * rem)
        }
        return Math.floor(Number(strings.trimEnd(vv, "px")))
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