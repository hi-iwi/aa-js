//@import atype

// static class
class math {


    static Wan = 10000 // 万
    static Yii = 100000000 // 亿

    name = 'aa-math'

    /**
     * Convert rem to px
     * @param vv
     * @param vk
     * @param defaultV
     * @return {number}
     */
    static px(vv, vk, defaultV) {
        vv = defval(...arguments)
        if (vv === null) {
            return 0
        }
        if (typeof vv === "number") {
            return Math.floor(vv)
        }
        vv = string(vv).replace(' ', '').toLowerCase()
        if (vv.indexOf("rem") > -1) {
            // 计算1rem对应px
            const rem = parseFloat(window.getComputedStyle(document.documentElement)["fontSize"])  // 1rem 对应像素
            return Math.floor(float32(vv.replace("rem", '')) * rem)
        }
        return Math.floor(float32(vv))
    }

    /**
     * 转换字节
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
     * @param {number|string} num
     * @param {number} n
     * @param {string} delimiter
     * @returns {string}
     */
    static thousands(num, n = 3, delimiter = ',') {
        num = String(num)
        if (!n || !delimiter || num.length <= n) {
            return num
        }
        const neg = num[0] === '-' ? 1 : 0
        let s2 = ""
        let j = 0
        for (let i = num.length - 1; i >= neg; i--) {
            if (j > 0 && j % n === 0) {
                s2 = delimiter + s2
            }
            s2 = num[i] + s2
            j++
        }
        return s2
    }
}