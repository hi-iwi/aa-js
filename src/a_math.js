class _aaMath {
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