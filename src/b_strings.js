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
     * Slice string by length in placeholder format
     * @param {Stringable} s
     * @param {number} length
     * @return {string}
     */
    static cutPlace(s, length) {
        s = string(s)
        // 为了setState时候，快速响应
        if (s.length < length) {
            return s
        }
        let ss = '', l = 0;
        for (let i = 0; i < s.length; i++) {
            l += strings.placeLen(s[i]);
            if (l >= length) {
                break;
            }
            ss += s[i];
        }
        return ss;
    }

    /**
     * Slice string by length in utf-8 format
     * @param {Stringable} s
     * @param {number} length
     * @return {string}
     */
    static cutUtf8(s, length) {
        s = string(s)
        // str.length is the shortest length
        if (s.length < length) {
            return s
        }
        let ss = '', l = 0;
        for (let i = 0; i < s.length; i++) {
            l += strings.utf8Len(s[i]);
            if (l >= length) {
                break;
            }
            ss += s[i];
        }
        return ss;
    }

    static countLen(s, lentype = "utf8") {
        if (!s) {
            return 0
        }
        return lentype === "utf8" ? Math.ceil(strings.utf8Len(s) / 3) : string(s).length
    }

    // 转义 reg exp
    /**
     * Escape RegExp source
     * @param {string} pattern
     * @return {string}
     */
    static escapeReg(pattern) {
        return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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
     * Stringify object into json string
     * @param {|struct|array|null} o
     * @return {string|null}
     */
    static json(o) {
        if (!o) {
            return null
        }
        try {
            // JSON.stringify bigint 需要先转为string
            return JSON.stringify(o, (_, v) => typeof v === 'bigint' ? v.toString() : v)
        } catch (error) {
            log.error(`json stringify error: ${error}`, o)
        }
        return null
    }


    /**
     * Join strings with the separator
     * @param {string} separator
     * @param args
     * @return {string}
     */
    static joinWith(separator, ...args) {
        let arr = []
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] !== 'undefined' && args[i] !== null && args !== '') {
                arr.push(string(args[i]))
            }
        }
        return arr.join(separator)
    }

    /**
     * Join strings with a blank string
     * @param args
     * @return {string}
     */
    static join(...args) {
        return strings.joinWith(' ', ...args)
    }

    /**
     * Join strings with the separator when the condition is true
     * @param {string} separator
     * @param {boolean} condition
     * @param args
     * @return {string}
     */
    static joinByWith(separator, condition, ...args) {
        if (!condition) {
            return string(args, 0)
        }
        return strings.joinWith(' ', ...args)
    }

    /**
     * Join strings when the condition is true
     * @param {boolean} condition
     * @param args
     * @return {string}
     */
    static joinBy(condition, ...args) {
        return strings.joinByWith(' ', condition, ...args)
    }

    /**
     * Get placeholder length of give string
     * @param {Stringable} s
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


    /**
     * Generate a random string
     * @param {number} length
     * @param {string} [base]
     */
    static random(length, base = strings.alphaNumeric) {
        base = strings.shuffle(base)
        let result = ''
        for (let i = 0; i < length; i++) {
            result += base[Math.floor(Math.random() * base.length)]
        }
        return result;
    }

    /**
     * New RegExp with escaped regexp pattern
     * @param {RegExp|string} pattern
     * @param {string} [flags]
     * @return {RegExp}
     */
    static regexp(pattern, flags) {
        if (typeof pattern === 'string') {
            pattern = strings.escapeReg(pattern)
        }
        return new RegExp(pattern, flags)
    }

    /**
     * Replace all matched text in a string
     * @param {Stringable} s
     * @param {string|{[key:string]:(string|number)}|(string|number)[][]|(string|number)[]} oldCut
     * @param {string} [newCut]
     * @return {string}
     * @example
     *  replaceAll("I'm Aario. Hi, Aario!", "Aario", "Tom")  ==> I'm Tom. Hi Tom!
     *  replaceAll("I'm Aario. Hi, Aario!", {
     *      "Aario": "Tom",
     *      "Hi": "Hello",
     *  })  ====>  I'm Tom. Hello Tom!
     *  replaceAll("I'm Aario. Hi, Aario!", [["Aario", "Tom"]])
     */
    static replaceAll(s, oldCut, newCut) {
        let cuts = []  // keep replace sequence
        if (Array.isArray(oldCut)) {
            cuts = oldCut.length > 0 && Array.isArray(oldCut[0]) ? oldCut : [oldCut]
        } else if (typeof oldCut === 'object') {
            for (const [a, b] of Object.entries(oldCut)) {
                cuts.push([a, b])
            }
        } else {
            cuts.push([oldCut, newCut])
        }

        s = string(s)
        cuts.map(cut=>{
            s = s.split(cut[0]).join(String(cut[1]))
        })

        return s
    }

    /**
     * Replaces the first matched text in a string
     * @param {Stringable} s
     * @param {string} oldCut
     * @param {string} newCut
     * @return {string}
     * @example replaceFirst("I'm Aario. Hi, Aario!", "Aario", "Tom")  ==> I'm Tom. Hi Aario!
     */
    static replaceFirst(s, oldCut, newCut) {
        s = string(s)
        const last = s.indexOf(oldCut);
        return last < 0 ? s : s.slice(0, last) + newCut + s.slice(last + oldCut.length)
    }

    /**
     * Replaces the last matched text in a string
     * @param {Stringable} s
     * @param {string} oldCut
     * @param {string} newCut
     * @return {string}
     * @example replaceLast("I'm Aario. Hi, Aario!", "Aario", "Tom")  ==> I'm Aario. Hi Tom!
     */
    static replaceLast(s, oldCut, newCut) {
        s = string(s)
        const last = s.lastIndexOf(oldCut);
        return last < 0 ? s : s.slice(0, last) + newCut + s.slice(last + oldCut.length)
    }


    /**
     * Shuffle a string
     * @param {string} s
     */
    static shuffle(s) {
        return arrays.shuffle(s.split('')).join('')
    }

    /**
     * Split and trim segments
     * @param {string|null|void} s
     * @param {string} [separator]
     * @return {string[]}
     */
    static split(s, separator = ',') {
        if (!s) {
            return []
        }
        let arr = []
        s.split(separator).map(v => {
            v = v.trim()
            if (v) {
                arr.push(v)
            }
        })
        return arr
    }

    /**
     * Repeat `n` times to trim the prefix and suffix `cut` from the string `s`, if n<1, trim unlimited
     * @param {Stringable} s
     * @param {string|number} [cut]
     * @param {number} [n]
     * @return {string}
     */
    static trim(s, cut = ' ', n) {
        s = strings.trimStart(s, cut, n)
        return strings.trimEnd(s, cut, n)
    }


    /**
     * Repeat `n` times to trim the prefix `cut` from the string `s`, if n<1, trim unlimited
     * @param {Stringable} s
     * @param {string|number} [cut]
     * @param {number} [n]
     * @return {string}
     */
    static trimStart(s, cut = ' ', n) {
        if (typeof cut === 'number' && typeof n === 'undefined') {
            n = cut
            cut = ' '
        }
        s = string(s)
        const length = s.length
        const step = cut.length
        if (!s || length < step) {
            return s
        }
        if (!n) {
            n = length
        }
        let i = 0
        let x = s.substring(i, i + step)
        while (x === cut && i < length && n > 0) {
            n--
            i += step
            x = s.substring(i, i + step)
        }
        return i > length - 1 ? '' : s.substring(i)
    }

    /**
     * Repeat `n` times to trim the suffix `cut` from the string `s`, if n<1, trim unlimited
     * @param {Stringable} s
     * @param {string|number} [cut]
     * @param {number} [n]
     * @return {string}
     */
    static trimEnd(s, cut = ' ', n) {
        if (typeof cut === 'number' && typeof n === 'undefined') {
            n = cut
            cut = ' '
        }
        s = string(s)
        const length = s.length
        const step = cut.length
        if (!s || length < step) {
            return s
        }
        if (!n) {
            n = length
        }
        let i = length
        let x = s.substring(i - step, i)

        while (x === cut && i > 0 && n > 0) {
            n--
            i -= step
            x = s.substring(i - step, i)
        }
        return i < 1 ? '' : s.substring(0, i)
    }

    /**
     *  Parse JSON string or object more fault-tolerant
     * @param {(jsonstr|struct|array|null)} o
     * @return {(*[]|struct|null)}
     * @constructor
     */
    static unjson(o) {
        if (!o) {
            return null
        }
        if (typeof o !== "string") {
            return o
        }
        try {
            return JSON.parse(o.trim())
        } catch (error) {
            log.error(`unjson error:${error}`, o)
        }
        return null
    }

    /**
     * Get utf8 length of given string
     * @param {Stringable} s
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
}