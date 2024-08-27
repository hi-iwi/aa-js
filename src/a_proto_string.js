/**
 * @param {string|number} b
 * @return {boolean}
 * @note
 *  "".is(null)     ===> true
 *  "".is(void 0)   ===> true
 *  "".is(0)        ===> false
 */
String.prototype.is = function (b) {
    return this === string(b)   // String(void 0) ===> "undefined"
}

/**
 * Joins strings, inserting a blank string between each
 * @param {any} args
 * @return {string}
 */
String.prototype.join = function (...args) {
    return this.joinWith(' ', ...args)
}


/**
 * Join strings if the condition is true
 * @param {boolean} condition
 * @param {any} args
 */
String.prototype.joinIf = function (condition, ...args) {
    return condition ? this.join(...args) : this
}


/**
 * Joins this string with other args together as a string, inserting a separator between each.
 * @param {string} separator
 * @param {any} args
 * @return {string}
 */
String.prototype.joinWith = function (separator, ...args) {
    let s = this
    for (let i = 0; i < args.length; i++) {
        let v = args[i]
        if (typeof v !== 'undefined' && v !== null && v !== '') {
            s = s ? separator + v : v
        }
    }
    return s
}

String.prototype.joinWithIf = function (condition, separator, ...args) {
    return condition ? this.joinWith(separator, ...args) : this
}

/**
 * Override String.prototype.replaceAll
 * @override
 * @param {string|RegExp|{[key:string]:(string|number)}|(string|number|RegExp)[][]|(string|number|RegExp)[]} searchValue
 * @param {string|((match0: string, ...matches: any[])=>string)} [replaceValue]
 * @return {string}
 * @example
 *  replaceAll("I'm Aario. Hi, Aario!", "Aario", "Tom")  ==> I'm Tom. Hi Tom!
 *  replaceAll("I'm Aario. Hi, Aario!", {
 *      "Aario": "Tom",
 *      "Hi": "Hello",
 *  })  ====>  I'm Tom. Hello Tom!
 *  replaceAll("I'm Aario. Hi, Aario!", [["Aario", "Tom"]])
 */
String.prototype.replaceAll = function (searchValue, replaceValue) {
    let s = this
    let cuts = []  // keep replace sequence
    if (Array.isArray(searchValue)) {
        cuts = searchValue.length > 0 && Array.isArray(searchValue[0]) ? searchValue : [searchValue]
    } else if (typeof searchValue === 'object') {
        for (const [a, b] of Object.entries(searchValue)) {
            cuts.push([a, b])
        }
    } else {
        cuts.push([searchValue, replaceValue])
    }
    cuts.map(cut => {
        let search = cut[0]
        let to = cut[1]
        if (search instanceof RegExp) {
            if (search.flags.indexOf('g') < 0) {
                throw new TypeError(`replaceAll must be called with a global RegExp (with g flag)`)
            }
            s = s.replace(search, to)
        } else {
            s = s.split(search).join(to)  // replaceValue can be a function only if search is a RegExp
        }
    })
    return s
}
/**
 * Replace if the string ends with `oldCut`
 * @param {str} s
 * @param {string} searchValue
 * @param {string} replaceValue
 * @return {string}
 */
String.prototype.replaceEnd = function (searchValue, replaceValue) {
    let s = this
    return s.endsWith(searchValue) ? s.replaceLastMatched(searchValue, replaceValue) : s
}
String.prototype.replaceFirstMatched = function (searchValue, replaceValue) {
    let s = this
    const first = s.indexOf(searchValue);
    return first < 0 ? s : s.slice(0, first) + replaceValue + s.slice(first + searchValue.length)
}
String.prototype.replaceLastMatched = function (searchValue, replaceValue) {
    let s = this
    const last = s.lastIndexOf(searchValue);
    return last < 0 ? s : s.slice(0, last) + replaceValue + s.slice(last + searchValue.length)
}
String.prototype.replaceStart = function (searchValue, replaceValue) {
    let s = this
    return s.startsWith(searchValue) ? s.replace(searchValue, replaceValue) : s
}
/**
 * @return {RegExp}
 */
String.prototype.toRegExp = function (flags) {
    return new RegExp(this.toRegSource(), flags)
}
/**
 * @return {string}
 */
String.prototype.toRegSource = function () {
    return this.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
/**
 * Split a string, then trim each segments and remove all empty string segments
 * @param {string|RegExp} separator
 * @param {number} [limit]
 * @return {string[]}
 * @example
 *  `color:#ff000; ; background:#fff`.splitTrim(';')  ===> ["color:#ff0000", "background:#fff"]
 */
String.prototype.splitTrim = function (separator, limit) {
    let s = this
    if (!s) {
        return []
    }
    let arr = []
    s.split(separator, limit).map(v => {
        v = v.trim()
        if (v) {
            arr.push(v)
        }
    })
    return arr
}

/**
 * Repeat `n` times to trim the suffix `cut` from the string `s`, if n<1, trim unlimited
 * @override
 * @param {str} s
 * @param {string|number} [cut]
 * @param {number} [n]
 * @return {string}
 */
String.prototype.trimEnd = function (cut = ' ', n) {
    let s = this
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
 * Repeat `n` times to trim the prefix `cut` from the string `s`, if n<1, trim unlimited
 * @override
 * @param {string|number} [cut]
 * @param {number} [n]
 * @return {string}
 */
String.prototype.trimStart = function (cut = ' ', n) {
    let s = this
    if (typeof cut === 'number' && typeof n === 'undefined') {
        n = cut
        cut = ' '
    }
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
 * Repeat `n` times to trim the prefix and suffix `cut` from the string `s`, if n<1, trim unlimited
 * @override
 * @param {str} s
 * @param {string|number} [cut]
 * @param {number} [n]
 * @return {string}
 */
String.prototype.trim = function (cut = ' ', n) {
    return this.trimStart(cut, n).trimEnd(cut, n)
}