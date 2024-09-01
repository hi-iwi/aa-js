/**
 * Set property of an object if this object not exists such property
 * @template T
 * @param {T} obj
 * @param {string|number} key
 * @param {any} value
 * @param {any[]} [excludes]
 * @return {T|struct|array}
 */
function setNx(obj, key, value, excludes) {
    if (!obj) {
        obj = typeof key === "number" ? [] : {}
    }
    if (typeof obj[key] === "undefined") {
        obj[key] = value
    } else if (excludes) {
        let v = obj[key]
        for (let i = 0; i < excludes.length; i++) {
            let ex = excludes[i]
            if (v === ex || (typeof v === "number" && typeof ex === "number" && isNaN(ex) && isNaN(v))) {
                obj[key] = value
                break
            }
        }
    }
    return obj
}

/**
 * Set property of an object if this object not exists such property or the value of this property is in ZeroValues
 * @template T
 * @param {T} obj
 * @param {string|number} key
 * @param {any} value
 * @return {T|struct|array}
 */
function setNz(obj, key, value) {
    return setNx(obj, key, value, ZeroValues)
}

/**
 * Equal or is empty
 *  eq(a, b)  ===> is a equals to b
 *  eq(a)     ===> is a empty
 * @param {any} a
 * @param {any} [b]
 * @return {boolean}
 * @example
 *  eq(a)  ===>  a && a !== "0"
 */
function eq(a, b) {
    a = string(a)  // @warn String(undefined) === "undefined";  string(undefined) === ""
    b = string(b)
    return a === b || (!a && b === "0") || (!b && a === "0")
}

/**
 * Not equal or not empty
 *  ne(a, b) ==> is a not equals to b
 *  ne(a)    ==> is a not empty
 * @param {any} a
 * @param {any} [b]
 * @return {boolean}
 */
function ne(a, b) {
    return !eq(a, b)
}

/**
 * Retry until ready
 * @param {()=>boolean} ready
 * @param {()=>void} run
 * @param {Timeout} interval
 * @param {number} [retry]
 */
function once(ready, run, interval, retry) {
    if (!ready()) {
        if (typeof retry === 'undefined') {
            retry = Math.ceil(5 * time.Second / interval)
        }
        if (retry === Infinity || retry > 0) {
            setTimeout(() => {
                once(ready, run, interval, retry === Infinity ? Infinity : retry - 1)
            }, interval)
        }
        return
    }
    run()
}

/**
 * Run forever
 * @param {(i:number)=>any} run
 * @param {Timeout} interval
 * @param {number} [i]
 */
function forever(run, interval, i = 0) {
    if (run(i) === BREAK) {
        return
    }
    setTimeout(() => {
        forever(run, interval, i + 1)
    }, interval)
}

/**
 * Try call the method if the method is a function
 * @param method
 * @param args
 * @return {*}
 */
function trycall(method, ...args) {
    if (!method) {
        return null
    }
    if (typeof method !== 'function') {
        loge(new TypeError(`trycall method is not a function`))
        return null
    }
    return method(...fmt.args(...args))
}


/**
 * Return defined value
 * @param {*} [vv]
 * @param {string} [vk]
 * @param {*} [defaultV]
 * @returns {null|*} return any type except type `undefined`
 * @note Golang 至今未支持三元写法，因此不代表某种习惯就必须要所有人接受。这里规定一种写法并无障碍，并非强制性要求。
 *  等同于  (vk ? (vv[vk] ? vv[vk] : defaultV) : vv )，尚未习惯的，可以使用这种常规写法
 */
function defval(vv, vk, defaultV) {
    defaultV = typeof defaultV === 'undefined' ? null : defaultV
    if (typeof vv === 'undefined' || vv === null) {
        return defaultV
    }
    if (!vk && vk !== 0) {
        return vv
    }
    return typeof vv[vk] === 'undefined' ? defaultV : vv[vk]
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

