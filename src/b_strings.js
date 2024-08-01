// @import atype

// a static class
class strings {
    name = "aa-strings"
    static atoz = 'abcdefghijklmnopqrstuvwxyz'
    static AtoZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    static Atoz = strings.AtoZ + strings.atoz    //  ascii of `a` is greater than 'A'
    static digits = '0123456789'
    static alphaNumeric = strings.Atoz + strings.digits

    /**
     * Shuffle a string
     * @param {string} s
     */
    static shuffle(s) {
        return arrays.shuffle(s.split('')).join('')
    }

    /**
     * Generate a random string
     * @param {number} length
     * @param {string} [base]
     */
    static random(length, base) {
        if (!base) {
            base = strings.alphaNumeric
        }
        base = strings.shuffle(base)
        let result = ''
        for (let i = 0; i < length; i++) {
            result += base[Math.floor(Math.random() * base.length)]
        }
        return result;
    }

    /**
     * Replaces the last matched text in a string, using a regular expression or search string.
     * @param str
     * @param pattern
     * @param replacement
     * @return {string|*}
     */
    static replaceLast(str, pattern, replacement) {
        const match =
                  typeof pattern === 'string'
                      ? pattern
                      : (str.match(new RegExp(pattern.source, 'g')) || []).slice(-1)[0];
        if (!match) return str;
        const last = str.lastIndexOf(match);
        return last !== -1
            ? `${str.slice(0, last)}${replacement}${str.slice(last + match.length)}`
            : str;
    }

    /**
     * Check is Zh-CN (simplified chinese)
     * @param {string} s
     * @return {boolean}
     */
    static isZhCN(s) {
        return /[^\u4e00-\u9fa5]/.test(s)
    }

    /**
     * Convert punctuation marks from Chinese to English
     * @param {string} s
     */
    static puncCn2En(s) {
        let arr = s.split('')
        let zh = [['～', '~'],
            ['·', '`'],
            ['！', '!'],
            ['¥', '$'],
            ['……', '^'],
            ['…', '^'],
            ['（', '('],
            ['）', ')'],
            ['——', '-'],
            ['—', '-'],
            ['【', '['],
            ['】', ']'],
            ['「', '{'],
            ['」', '}'],
            ['｜', '|'],
            ['、', '\\'],
            ['；', ';'],
            ['：', ':'],
            ['‘', "'"],
            ['“', '"'],
            ['，', ','],
            ['《', '<'],
            ['。', '.'],
            ['》', '>'],
            ['？', '?']]

        arr.map((char, i) => {
            for (let j = 0; j < zh.length; j++) {
                if (char === zh[j][0]) {
                    arr[i] = zh[j][1]
                }
            }
        })
        return arr.join('')
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
        return lentype === "utf8" ? Math.ceil(strings.utf8Len(s) / 3) : string(s).length
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
            l += strings.utf8Len(str[i]);
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
            l += strings.placeLen(s[i]);
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
    static unjson(o) {
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

    static joinWith(separator, ...args) {
        let arr = []
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] !== 'undefined' && args[i] !== null && args !== '') {
                arr.push(string(args[i]))
            }
        }
        return arr.join(separator)
    }

    static join(...args) {
        return strings.joinWith(' ', ...args)
    }

    static joinByWith(separator, condition, ...args) {
        if (!condition) {
            return string(args, 0)
        }
        return strings.joinWith(' ', ...args)
    }

    static joinBy(condition, ...args) {
        return strings.joinByWith(' ', condition, ...args)
    }


}