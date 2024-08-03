/**
 * @typedef { "array"|"boolean"|"class"|"date"|"dom"|"function"|"null"|"number"|"struct"|"string"|"undefined"|"regexp"} atypes
 */

//  react state  数字 001231 === 1231 == 001231.000  这些数值都没有变化，state就不会触发

function run(method, ...args) {
    if (typeof method === 'function') {
        method(...args)
    }
}

function range(start, end, step, callback) {
    step = Math.abs(step)
    if (start < end) {
        for (let i = start; i < end; i += step) {
            const r = callback(i)
            if (r === BREAK_SIGNAL) {
                return BREAK_SIGNAL
            }
        }
    }
    for (let i = start; i > end; i -= step) {
        const r = callback(i)
        if (r === BREAK_SIGNAL) {
            return BREAK_SIGNAL
        }
    }
}

/**
 * Return defined value
 * @param {*} [vv]
 * @param {StringN} [vk]
 * @param {*} [defaultV]
 * @returns {null|*} return any type except type `undefined`
 * @note Golang 至今未支持三元写法，因此不代表某种习惯就必须要所有人接受。这里规定一种写法并无障碍，并非强制性要求。
 *  等同于  (vk ? (vv[vk] ? vv[vk] : defaultV) : vv )，尚未习惯的，可以使用这种常规写法
 */
function defval(vv, vk, defaultV) {
    if (typeof vv === "undefined" || typeof defaultV === "undefined") {
        defaultV = null
    }
    if (!vk && vk !== 0) {
        return typeof vv === "undefined" || vv === null || vv === "" ? defaultV : vv
    }

    if (typeof vv !== "object" || vv === null || !vv.hasOwnProperty(vk)) {
        return defaultV
    }
    vv = vv[vk]
    return typeof vv === "undefined" || vv === null || vv === "" ? defaultV : vv
}

/**
 * Trim the tail
 * @return {((x:number)=> number)}
 */
function RoundTrim() {
    this.name = 'trim'
    return v => v > 0 ? Math.floor(v) : Math.ceil(v)
}

/**
 * @return {((x:number)=> number)}
 */
function RoundReverse() {
    this.name = 'reverse'
    return v => v > 0 ? Math.round(v) : -Math.round(-v)
}

/**
 * Round away from the origin point
 * @return {((x:number)=> number)}
 */
function RoundAway() {
    this.name = 'away'
    return v => v > 0 ? Math.ceil(v) : Math.floor(v)
}

/**
 *
 * @param {('round'|'floor'|'ceil'|'reverse'|'trim'|'away'|((x :number)=>number))} round
 * @return {((x: number) => number)|(function(): function(*): number)|(function(*): *)|*}
 */
function Round(round) {
    if (typeof round === "function") {
        return round
    }
    switch (round) {
        case 'floor':
            return Math.floor
        case 'round':
            return Math.round
        case 'ceil':
            return Math.ceil
        case 'reverse':
            return RoundReverse
        case 'trim':
            return RoundTrim
        case 'away':
            return RoundAway
    }
    throw new ReferenceError('invalid Round type')
}


class atype {
    static array = "array"
    static boolean = "boolean"
    static class = "class"
    static date = "date"
    static dom = "dom"
    static function = "function"
    static null = "null"
    static number = "number"
    static struct = "struct"
    static string = "string"
    static undefined = "undefined"
    static regexp = "regexp"
    // 类型别名
    static alias = {
        array    : "a",
        boolean  : "b",
        class    : "c",
        date     : "d",
        dom      : "h",
        function : "f",
        null     : "l",
        number   : "n",
        struct   : "m",
        string   : "s",
        undefined: "u",
        regexp   : "r",
    }

    static toStringCallable(v) {
        if (v && typeof v.toString === 'function') {
            return v.toString().indexOf('[object ') !== 0
        }
        return false
    }

    /**
     * Zeroize a value
     * @param v
     * @param {boolean} [nullable]
     */
    static zeroize(v, nullable = false) {
        if (!v) {
            return v
        }
        if (typeof v === "string") {
            if (/^\d{4}-[01]\d-[03]\d[\sT][0-2]\d:[0-5]\d:[0-5]\d$/.test(v)) {
                return '0000-00-00 00:00:00'
            }
            return /^\d{4}-[01]\d-[03]\d$/.test(v) ? '0000-00-00' : ''
        }
        switch (atype.of(v)) {
            case atype.array:
                return nullable ? null : []
            case atype.boolean:
                return false
            case atype.class:
                return null
            case atype.date:
                return null
            case atype.dom:
                return null
            case atype.function:
                return nullable ? null : nif
            case atype.null:
                return null
            case atype.number:
                return 0
            case atype.struct:
                v = nullable ? null : {}
                return v.length === 0
            case atype.string:
                return ""
        }
        return typeof v === "object" ? null : void 0
    }

    // 缩短类型为1个字符
    static aliasOf(t) {
        if (typeof t === "undefined") {
            return atype.alias.undefined
        }
        if (t === null) {
            return atype.alias.null
        }
        if (typeof t !== "string") {
            t = atype.of(t)
        }
        return atype.alias[t] ? atype.alias[t] : atype.alias.undefined
    }

    /*

"array", "boolean", "date", "dom", "function", null, "number", "struct", "string", "undefined", "regexp" "class"
/[a-z]/.constructor
"John".constructor                // Returns function String(){[native code]}
(3.14).constructor                // Returns function Number(){[native code]}
false.constructor                 // Returns function Boolean(){[native code]}
[1,2,3,4].constructor             // Returns function Array(){[native code]}
{name:'John',age:34}.constructor  // Returns function Object(){[native code]}
new Date().constructor            // Returns function Date(){[native code]}
function () {}.constructor        // Returns function Function(){[native code]}
NaN.constructor                     ƒ Number(){ [native code] }
HTMLAnchorElement  / HTMLCollection     dom
jQuery dom     // function(e,t){return new c.fn.init(e,t)}
class   // Returns function XXX()
 */

    // @notice 不要用 AaLib.Type 判断是否 undefined；用 typeof(n) === "undefined" 更适合
    static of(v, ...args) {
        if (len(args) > 0) {
            if (typeof v !== "object" || v === null) {  // typeof null is object
                return atype.null
            }
            let k = args[0]
            if (!v.hasOwnProperty(k)) {
                return atype.undefined
            }
            v = v[k]
        }
        if (v === null) {
            return atype.null
        }
        if (Array.isArray(v)) {
            return atype.array
        }
        let t = typeof v
        if ([atype.boolean, atype.function, atype.number, atype.string, atype.undefined].includes(t)) {
            return t
        }

        // Safari replace 总是出幺蛾子！！！
        let typ = v.constructor.toString().toLowerCase()
        typ = typ.replace(/.*function\s+([a-z]+)\s*\(\)\s*{\s*\[[^\]]+]\s*}.*/, "$1")
        typ = typ.trim()
        if (typ.length > 9) {
            // 使用 new Cls()
            if (typ.indexOf("_classcallcheck") > 0) {
                return atype.class
            }
            if (typ.substring(0, 4) === "html" || $(v).length > 0) {
                typ = atype.dom
            }
        }
        return typ === "object" ? atype.struct : typ
    }

    // 对象 a={}   !a 为 false。。  a =={} 也是 false
    static isEmpty(...args) {
        let v = defval(...args)
        if (v === null) {// 不要用 AaLib.Type 判断是否 undefined
            return true
        }

        switch (atype.of(v)) {
            case atype.array:
                return v.length === 0
            case atype.boolean:
                return !v
            case atype.class:
                return false
            case atype.date:
            case atype.dom:
            case atype.function:
                return false
            case atype.null:
                return true
            case atype.number:
                return v <= 0
            case atype.struct:
                v = Object.keys(v)
                return v.length === 0
            case atype.string:
                return v === ""
        }
        return !v
    }

    static notEmpty(...args) {
        return !atype.isEmpty(...args)
    }

    /**
     * 必须是 > 0的数字，注意 bigint
     * @param {vv_vk_defaultV} args
     * @return {boolean|boolean}
     */
    static isRealId(...args) {
        let v = defval(...args)
        return v === null ? false : (uint64a(v) !== "0")
    }

    /**
     * @param {vv_vk_defaultV} args
     * @return {boolean}
     */
    static notRealId(...args) {
        return !atype.isRealId(...args)
    }

    /**
     * @param {vv_vk_defaultV} args
     * @return {boolean}
     */
    static isArray(...args) {
        return Array.isArray(defval(...args))
    }

    /**
     * @param {vv_vk_defaultV} args
     * @return {boolean}
     */
    static isBoolean(...args) {
        return typeof defval(...args) === "boolean"
    }


    /**
     * @param {vv_vk_defaultV} args
     * @return {boolean}
     * @note 仅为 {} 结构体；不要用 typeof arr === "object" 判定是否是结构体，因为 typeof [] 也是 object。而 AaType.Of([]) 为array, AaType.Of({}) 为 object
     */
    static isStruct(...args) {
        return atype.of(...args) === "struct"
    }

    /**
     * @param {vv_vk_defaultV} args
     * @return {boolean}
     */
    static isDate(...args) {
        return atype.of(...args) === "date"
    }

    /**
     * @param {vv_vk_defaultV} args
     * @return {boolean}
     */
    static isDom(...args) {
        return atype.of(...args) === "dom"
    }

    /**
     * @param {vv_vk_defaultV} args
     * @return {boolean}
     */
    static isFunction(...args) {
        return typeof defval(...args) === "function"
    }

    /**
     * @param {vv_vk_defaultV} args
     * @return {boolean}
     */
    static isNumber(...args) {
        return typeof defval(...args) === "number"
    }

    /**
     * @param {vv_vk_defaultV} args
     * @return {boolean}
     */
    static isString(...args) {
        return typeof defval(...args) === "string"
    }

    /**
     * @param {vv_vk_defaultV} args
     * @return {boolean}
     */
    static isRegexp(...args) {
        return atype.of(...args) === "regexp"
    }


}


//  防止直接用 for( < len(x)) 导致异常
/**
 * Get length of anything
 * @param {vv_vk_defaultV} [args]
 * @return {number}
 */
function len(...args) {
    let v = defval(...args)
    if (typeof v === "undefined" || v === null) {
        return 0
    }
    if (typeof v === "number" || typeof v === 'string') {
        return String(v).length
    }
    if (Array.isArray(v)) {
        return v.length    // s.match() 必须不可用下面，否则长度会多
    }
    // 特定 .len(): number
    if (typeof v.len === "function") {
        const l = v.len()
        if (typeof l === "number") {
            return l
        }
    }
    return Object.keys(v).length  // support string,array, object
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {function}
 */
function func(...args) {
    let v = defval(...args)
    if (typeof v === "function") {
        return v
    }
    return nif
}


function _inRange(x, min, max, name) {
    if (x < min || x > max) {
        if (!name) {
            name = "[" + min + "," + max + "]"
        }
        let msg = x + " can't be converted to " + name
        throw new RangeError(msg)
    }
    return x
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {boolean}
 */
function bool(...args) {
    let v = defval(...args)
    if (v === null) {// 不要用 AaLib.Type 判断是否 undefined
        return false
    }

    switch (typeof v) {
        case "number":
            return v > 0
        case "boolean":
            return v
        case "string":
            v = v.trim().toLowerCase()
            if (v === "") {
                return false
            }
            // html readonly="readonly" 这种情况是 true
            // bool("null")  ===>  false       "null" 是 false 词汇
            // bool({null:"null"}, "null")  ===>  true
            if (args.length > 0 && (args[0] + '').toLowerCase() === v) {
                return true
            }

            /*
                     null
             TRUE -> false
             1    -> 0
             yes   -> no
             on  -> off  // html attribute 会用到
             */
            return !["false", "0", "no", "off", "null"].includes(v)
    }
    return !!v
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {0|1}
 */
function booln(...args) {
    return bool(...args) ? 1 : 0
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {boolean}
 */
function not(...args) {
    return !bool(...args)
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {string}
 */
function string(...args) {
    let v = defval(...args)
    if (v === null) {
        return ""
    }

    // toJSON 一定是最终数据
    if (typeof v.toJSON === "function") {
        return string(v.toJSON())
    }


    // array, AaImgSrc, Decimal, Money, Percent, VMoney, Time, Date
    // [1,2,3].toString() ==> 1,2,3
    // Time toString 更接近 toJSON，比 valueOf() 更适合
    if (typeof v.toString === "function" && v.toString().indexOf('[object ') !== 0) {
        return v.toString()
    }
    // time, Date
    if (typeof v.valueOf === "function") {
        return string(v.valueOf())
    }


    return v + ''
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {number}
 * @note js 数字全部是采用的双精度浮点数存储的。 js number 最大值是：9007199254740992
 */
function number(...args) {
    return Number(defval(...args))
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {number}
 */
function float64(...args) {
    return number(...args)
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {number}
 */
function float32(...args) {
    return float64(...args)
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {string}
 * @note int64 最大值：9223372036854775807  >  js number 最大值 Number.MAX_SAFE_INTEGER = 9007199254740992
 */
function int64a(...args) {
    // int64 和 uint64 都用string类型
    let v = defval(...args)
    return v === null ? "0" : v + ''
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {number}
 */
function intMax(...args) {
    return Math.floor(number(...args))
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {number}
 */
function int32(...args) {
    return _inRange(intMax(...args), -2147483648, 2147483647, 'int32')
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {number}
 */
function int24(...args) {
    return _inRange(intMax(...args), -8388608, 8388607, 'int24')
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {number}
 */
function int16(...args) {
    return _inRange(intMax(...args), -32768, 32767, 'int16')
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {number}
 */
function int8(...args) {
    return _inRange(intMax(...args), -128, 127, 'int8')
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {string}
 */
function uint64a(...args) {
    // int64 和 uint64 都用string类型
    let v = defval(...args)
    return v === null ? "0" : (v + '')
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {number}
 */
function uint32(...args) {
    return _inRange(intMax(...args), 0, 4294967295, 'uint32')
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {number}
 */
function uint24(...args) {
    return _inRange(intMax(...args), 0, 16777215, 'uint24')
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {number}
 */
function uint16(...args) {
    return _inRange(intMax(...args), 0, 65535, 'uint16')
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {number}
 */
function uint8(...args) {
    return _inRange(intMax(...args), 0, 255, 'uint8')
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {struct}
 */
function struct(...args) {
    let v = defval(...args)
    if (v === null || typeof v !== "object") {
        return {}
    }
    if (Array.isArray(v)) {
        return {...v} // 数组转 object，如果用这种方法转化struct，会重新开辟内存
    }
    return v
}

/**
 * @param {vv_vk_defaultV} [args]
 * @return {array}
 */
function array(...args) {
    let v = defval(...args)
    if (v === null || typeof v !== "object") {
        return []
    }
    if (Array.isArray(v)) {
        return v
    }
    // Object.values 可以转化：struct, array, string，其他都转为空数组；这种方法会重新开辟内存
    return [v]
}

