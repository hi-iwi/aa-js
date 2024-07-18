//  react state  数字 001231 === 1231 == 001231.000  这些数值都没有变化，state就不会触发


/**
 * defined value
 * @param {*} vv
 * @param {string|number} [vk]
 * @param {*} [defaultV]
 * @returns {null|*}
 *
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
    static isEmpty(vv, vk) {
        let v = defval(vv, vk)
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

    // 必须是 > 0的数字，注意 bigint
    static isRealId(...args) {
        let v = defval(...args)
        return v === null ? false : (uint64a(v) !== "0")
    }

    static notRealId(...args) {
        return !atype.isRealId(...args)
    }

    static isArray(...args) {
        return Array.isArray(defval(...args))
    }

    static isBoolean(...args) {
        return typeof defval(...args) === "boolean"
    }

    // 仅为 {} 结构体；
    // @warn ，不要用 typeof arr === "object" 判定是否是结构体，因为 typeof [] 也是 object。而 AaType.Of([]) 为array, AaType.Of({}) 为 object
    static isStruct(...args) {
        return atype.of(...args) === "struct"
    }


    static isDate(...args) {
        return atype.of(...args) === "date"
    }

    static isDom(...args) {
        return atype.of(...args) === "dom"
    }

    static isFunction(...args) {
        return typeof defval(...args) === "function"
    }

    static isNumber(...args) {
        return typeof defval(...args) === "number"
    }

    static isString(...args) {
        return typeof defval(...args) === "string"
    }

    static isRegexp(...args) {
        return atype.of(...args) === "regexp"
    }


}


// len(bool) len(number) 为 0，防止直接用 for( < len(x)) 导致异常
function len(...args) {
    let v = defval(...args)
    if (typeof v === "undefined" || v === null) {
        return 0
    }
    // 这个作为基础函数，不要被其他函数调用。特别是 AaLib.Val() / AaType.Of()，否则死循环调用
    if (typeof v === "number") {
        v = v + ''
    }
    if (Array.isArray(v)) {
        return v.length    // s.match() 必须不可用下面，否则长度会多
    }
    return Object.keys(v).length  // 支持string,array, object
}

function func(...args) {
    let v = defval(...args)
    if (typeof v === "function") {
        return v
    }
    return nif  // 空函数，用这种写法
}

// 使用  f && f()   即可；或者  func(p,'func')()
// function call(f, ...args) {
//     if (typeof f !== "function") {
//         return
//     }
//     f(...args)
// }

function _inRange(x, min, max, name) {
    if (x < min || x > max) {
        if (!name) {
            name = "[" + min + "," + max + "]"
        }
        let msg = x + " can't be converted to " + name
        throw new RangeError(msg)
        // console.warn(x + " is out of range [" + min + "," + max + "]")
        // return x < min ? min : max
    }
    return x
}

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

function booln(...args) {
    return bool(...args) ? 1 : 0
}

function not(...args) {
    return !bool(...args)
}

function nullable(...args) {
    let v = defval(...args)
    return len(v) === 0 ? null : v
}

function string(...args) {
    let v = defval(...args)
    if (v === null) {
        return ""
    }
    if (typeof v.toString === "function") {
        return v.toString()
    }

    return v + ''
}


// js 数字全部是采用的双精度浮点数存储的。 js number 最大值是：9007199254740992
function number(...args) {
    return Number(defval(...args))
}

function float64(...args) {
    return number(...args)
}

function float32(...args) {
    return float64(...args)
}

// int64 最大值：9223372036854775807  >  js number 最大值 9007199254740992
function int64a(...args) {
    // int64 和 uint64 都用string类型
    let v = defval(...args)
    return v === null ? "0" : v + ''
}

// 9007199254740992 Number.MAX_SAFE_INTEGER
function intMax(...args) {
    return Math.floor(number(...args))
}

function moneyOld(...args) {
    return Math.floor(number(...args))
}


function int32(...args) {
    return _inRange(intMax(...args), -2147483648, 2147483647, 'int32')
}

function int24(...args) {
    return _inRange(intMax(...args), -8388608, 8388607, 'int24')
}

function int16(...args) {
    return _inRange(intMax(...args), -32768, 32767, 'int16')
}

function int8(...args) {
    return _inRange(intMax(...args), -128, 127, 'int8')
}

function uint64a(...args) {
    // int64 和 uint64 都用string类型
    let v = defval(...args)
    return v === null ? "0" : (v + '')
}

function uint32(...args) {
    return _inRange(intMax(...args), 0, 4294967295, 'uint32')
}

function uint24(...args) {
    return _inRange(intMax(...args), 0, 16777215, 'uint24')
}

function uint16(...args) {
    return _inRange(intMax(...args), 0, 65535, 'uint16')
}

function uint8(...args) {
    return _inRange(intMax(...args), 0, 255, 'uint8')
}

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

