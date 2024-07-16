// a static class
class slice {
    name = "aa-slice"

    /**
     * Check is Zh-CN (simplified chinese)
     * @param {string} s
     * @return {boolean}
     */
    static isZhCN(s) {
        return /[^\u4e00-\u9fa5]/.test(s)
    }


    // 转义 reg exp
    static escapeReg(exp) {
        if (typeof exp === "string") {
            exp = exp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
        }
        return exp
    }

    /**
     * Get utf8 length of given string
     * @param {string} s
     * @return {number}
     */
    static utf8Len(s) {
        s = string(s)
        let l = 0;
        for (let i = 0; i < s.length; i++) {
            let c = s.charCodeAt(i);
            if (c < 127) {
                l++;
            } else if ((128 <= c) && (c <= 0x07ff)) {
                l += 2;
            } else if ((0x0800 <= c) && (c <= 0xffff)) {
                l += 3;
            } else {
                l += 4;
            }
        }
        return l;
    }

    /**
     * Get placeholder length of give string
     * @param {string} s
     * @return {number}
     */
    static placeLen(s) {
        s = string(s)
        let l = 0;
        for (let i = 0; i < s.length; i++) {
            l += (s.charCodeAt(i) < 127) ? 1 : 2;
        }
        return l;
    }

    static countLen(s, lentype = "utf8") {
        return lentype === "utf8" ? Math.ceil(slice.utf8Len(s) / 3) : string(s).length
    }

    /**
     * Slice string by length in utf-8 format
     * @param str
     * @param length
     * @return {string|string|*}
     */
    static cutUtf8(str, length) {
        str = string(str)
        // str.length is the shortest length
        if (str.length < length) {
            return str
        }
        let s = '', l = 0;
        for (let i = 0; i < str.length; i++) {
            l += slice.utf8Len(str[i]);
            if (l >= length) {
                break;
            }
            s += str[i];
        }
        return s;
    }

    /**
     * Slice string by length in placeholder format
     * @param s
     * @param len
     * @return {string|string|*}
     */
    static cutPlace(s, len) {
        s = string(s)
        // 为了setState时候，快速响应
        if (s.length < len) {
            return s
        }
        let ss = '', l = 0;
        for (let i = 0; i < s.length; i++) {
            l += slice.placeLen(s[i]);
            if (l >= len) {
                break;
            }
            ss += s[i];
        }
        return ss;
    }



    /**
     *  Parse JSON string or object more fault-tolerant
     * @param {(string|{[key:string]:*}|null)} o
     * @return {([]|{}|null)}
     * @constructor
     */
    static JSON(o) {
        try {
            if (typeof o !== "string") {
                return o
            }
            return JSON.parse(o.trim())
        } catch (e) {
            if (!["", "NULL", null].includes(o)) {
                console.error("bad json `" + o + "`")
            }
        }
        return null
    }

}