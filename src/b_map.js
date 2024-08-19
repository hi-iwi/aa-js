/**
 * @import atype
 * @typedef {struct|map|Map|URLSearchParams|*} Iterator
 */

// 自定义map类型  参考 Map
class map {
    name = 'aa-map'

    props

    // len() 函数会识别这个
    get len() {
        return this.keys().length
    }

    /**
     * @param {struct|FormData|jsonstr} [props]
     */
    init(props) {
        if (!props) {
            this.props = {}
            return
        }
        this.props = map.parse(props)
    }

    /**
     * @param {struct|FormData|jsonstr} [props]
     */
    constructor(props) {
        if (props instanceof map) {
            return props
        }
        this.init(props)
    }

    /**
     *
     * @return {Generator<StringN|any[], void, *>}
     */
    * [Symbol.iterator]() {
        for (let [key, value] of this.entries()) {
            yield [key, value]
        }
    }

    clear() {
        this.props = {}
    }

    clone() {
        return new map(map.clone(this.props))
    }

    /**
     * Delete a key in this map
     * @param {StringN} key
     */
    delete(key) {
        delete this.props[key]
    }

    entries() {
        return Object.entries(this.props)
    }

    /**
     * Extend items from an object
     * @param {map|struct} obj
     */
    extend(obj) {
        map.forEach(obj, (key, value) => {
            this.set(key, value)
        })
        return this
    }

    /**
     * @param {IteratorCallback} callback
     * @param {SortMethod} [sort]
     * @return {*[]|void}
     */
    forEach(callback, sort = false) {
        return map.forEach(this.props, callback, sort)
    }

    /**
     * Get from map
     * @param {StringN} key
     * @param {(value:any)=>any} [cast]
     * @return {*}
     */
    get(key, cast) {
        let v = this.has(key) ? this.props[key] : void 0
        return typeof cast === 'function' ? cast(v) : v
    }

    /**
     * Get or set
     * @param {StringN} key
     * @param defaultValue
     * @param allowUndefined
     * @return {*}
     */
    getOrSet(key, defaultValue, allowUndefined = false) {
        if (!this.has(key, allowUndefined)) {
            this.set(key, defaultValue)
        }
        return this.get(key)
    }

    /**
     * Check map has property key, and its value is not undefined
     * @param {StringN} key
     * @param allowUndefined
     * @return {boolean}
     */
    has(key, allowUndefined = false) {
        return this.props.hasOwnProperty(key) && (allowUndefined || typeof this.props[key] != "undefined")
    }

    /**
     * Join object keys and values
     * @param {string} [kvSeparator]
     * @param {string} [separator]
     * @param {(key:StringN, value:any)=>boolean} [assert]
     * @param {SortMethod} [sort]
     * @return {string}
     */
    join(kvSeparator = '=', separator = '&', assert = null, sort = true) {
        return map.join(this, kvSeparator, separator, assert, sort)
    }

    keys() {
        return Object.keys(this.props)
    }

    /**
     * Set an item
     * @param {StringN} key
     * @param value
     */
    set(key, value) {
        this.props[key] = value
    }

    /**
     * Sort this map
     * @param {(a:any,b:any)=>number} [compareFn]
     * @return {map}
     */
    sort(compareFn) {
        let ks = this.keys().sort(compareFn);
        let sortedObj = {};
        for (let i = 0; i < ks.length; i++) {
            sortedObj[ks[i]] = this.props[ks[i]];
        }
        this.props = sortedObj
        return this
    }


    /**
     *
     * @param {(key:StringN, value:any)=>{key:string,value:any, ok:boolean}} [hook]
     * @param {((a:any, b:any)=>number)|boolean} [sort]
     * @return {string}
     */
    toQueryString(hook, sort = true) {
        return this.join('=', '&', (key, value) => {
            if (hook) {
                let {k, v, ok} = hook(key, value)
                if (!ok) {
                    return {k, v, ok}
                }
                key = k
                value = v
            }

            value = string(value)
            if (value === '') {
                return {key, value, ok: false}
            }
            value = encodeURIComponent(value)
            return {key, value, ok: true}
        }, sort)
    }

    toString() {
        return strings.json(this.props)
    }

    values() {
        return Object.values(this.props)
    }

    /**
     *
     * @param target A
     * @param source B
     * @param {(v:any)=>any} [keynameConvertor]
     * @return {struct}    A = A ∪ B
     */
    static assign(target, source, keynameConvertor) {
        target = struct(target)
        source = struct(source)
        map.forEach(source, (k, v) => {
            if (typeof keynameConvertor === 'function') {
                k = map.handleKeyname(target, k, keynameConvertor)
            }
            target[k] = map.clone(v)
        })
        return target
    }

    /**
     * Deep clone any data except functions and classes
     *  深度复制一个对象；浅复制，就自行  newObj  = {...obj}
     * @param {object|array|struct|map|string|number|boolean|*} data
     * @returns {struct|null}
     */
    static clone(data) {
        if (typeof data !== 'object' || data === null) {
            return data
        }
        if (typeof data.clone === 'function') {
            return data.clone()
        }
        if (Array.isArray(data)) {
            let newData = []
            data.map((value, i) => {
                newData[i] = map.clone(value)
            })
            return newData
        }
        try {
            let newData = {}
            map.forEach(data, (key, value) => {
                newData[key] = map.clone(value)
            })
            return newData
        } catch (err) {
        }

        try {
            return strings.unjson(strings.json(data))
        } catch (err) {
        }
        return data
    }

    /**
     * Compare two object
     * @param {*} target
     * @param {*} src
     * @warn 如果用在 react 判断是否改变props/state 去 setState，需要用 if(!map.compare()) ， 否则就是true，死循环更新
     */
    static compare(target, src) {
        if (typeof target !== typeof src || len(target) !== len(src)) {
            return false
        }
        if (target === null || typeof target === 'undefined') {
            return !src             // 前面已经判断了类型一致
        }
        if (typeof target.valueOf === "function") {
            return typeof src.valueOf === "function" ? target.valueOf() === src.valueOf() : false
        }

        // time, Date, OSS imageSrc/fileSrc/audioSrc/videoSrc
        if (typeof target.toJSON === "function") {
            return typeof src.toJSON === "function" ? target.toJSON() === src.toJSON() : false
        }

        const t = atype.of(target)
        // "array", "boolean", "date", "dom", "function", null, "number", "object", "string", "undefined"

        if (t === "dom" || t === "function") {
            return target === src
        }

        if (t === "array") {
            let n = target.length
            // compared len(target)   len(src) already
            for (let i = 0; i < n; i++) {
                if (!map.compare(target[i], src[i])) {
                    return false
                }
            }
        }

        if (typeof t === "object") {
            let result = true
            map.forEach(target, (k, v) => {
                if (!map.compare(v, src[k])) {
                    result = false
                    return BREAK_SIGNAL
                }
            })
            return result

        }
        return target === src
    }

    /**
     * Compare property values of two struct
     * @param {struct} a
     * @param {struct} b
     * @param {string[]} keys
     * @return {boolean}
     */
    static compareProps(a, b, keys) {
        if (!keys) {
            return map.compare(a, b)
        }
        if (!a || !b) {
            return false
        }
        for (let k = 0; k < keys.length; k++) {
            if (a[k] !== b[k]) {
                return false
            }
        }
        return true
    }

    /**
     * Whether object contains all of these elements
     * @param {struct} obj
     * @param {string|array} params
     */
    static containAll(obj, ...params) {
        if (params.length === 1 && Array.isArray(params)) {
            params = params[0]
        }
        for (let i = 0; i < params.length; i++) {
            if (!obj.hasOwnProperty(params[i])) {
                return false
            }
        }
        return true
    }

    /**
     * Whether object contains any of these elements
     * @param obj
     * @param params
     * @return {boolean}
     */
    static containAny(obj, ...params) {
        if (params.length === 1 && Array.isArray(params)) {
            params = params[0]
        }
        for (let i = 0; i < params.length; i++) {
            if (obj.hasOwnProperty(params[i])) {
                return true
            }
        }
        return true
    }


    /**
     * Abandon matched object
     * @param {struct[]} objects
     * @param {struct} condition
     * @return {struct}
     */
    static discard(objects, condition) {
        const [_, i] = map.find(objects, condition)
        if (i < 0) {
            return objects
        }
        objects.splice(i, 1)
        return objects
    }

    /**
     * Fill up the non-existent properties of the first object with the second object's
     * @description 将两个对象的差集填充进target对象。通常用于填充默认配置。
     * @param {Class|struct} target   A --> 会污染 target
     * @param {struct} defaults B
     * @param {function} [handler]
     * @return  {Class|struct}    A = A ∪ (A - B)
     */
    static fillUp(target, defaults, handler) {
        target = struct(target)
        defaults = struct(defaults)
        if (!handler) {
            handler = (k, v, target) => {
                if (typeof target[k] === "undefined") {
                    target[k] = v
                }
            }
        }
        map.forEach(defaults, (k, v) => {
            handler(k, v, target, defaults)
        })
        return target
    }

    /**
     * Find the first matched object
     * @param {struct[]} objects
     * @param {struct} condition
     * @return {number|struct|null[]} the index and the matched object
     */
    static find(objects, condition) {
        Loop:
            for (let i = 0; i < objects.length; i++) {
                for (const [k, v] of Object.entries(condition)) {
                    if (objects[i][k] !== v) {
                        continue Loop
                    }
                }
                return [objects[i], i]
            }
        return [null, -1]
    }

    /**
     * @param {iterable} iterable
     * @param {IteratorCallback} callback
     * @param {SortMethod} [sort]
     * @return {*[]|void}
     */
    static forEach(iterable, callback, sort = false) {
        panic.errorType(iterable, 'object')
        if (!iterable) {
            return
        }
        if (!sort) {
            if (typeof iterable.forEach === 'function') {
                return iterable.forEach(callback)
            }

            function foreach(iterator) {
                let resultsOK = false
                let results = []
                for (const [key, value] of iterator) {
                    const result = callback(key, value)
                    if (result === BREAK_SIGNAL) {
                        break
                    }
                    if (!resultsOK && typeof result !== 'undefined') {
                        resultsOK = true
                    }
                    results.push(result)
                }
                return resultsOK ? results : void []
            }

            if (typeof iterable[Symbol.iterator] === 'function') {
                return foreach(iterable)
            }

            if (typeof iterable.entries === 'object' && typeof iterable.entries[Symbol.iterator] === 'function') {
                return foreach(iterable.entries)
            }

            if (typeof iterable.entries === 'function') {
                const entries = iterable.entries()
                if (typeof entries[Symbol.iterator] === 'function') {
                    return foreach(entries)
                }
            }
            return foreach(Object.entries(iterable))
        }

        let keys = typeof iterable.keys === 'function' ? iterable.keys() : Object.keys(iterable)
        keys.sort(typeof sort === 'function' ? sort : void nif)

        let resultsOK = false
        let results = [] // React 会需要通过这个渲染array/struct
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            const value = typeof iterable.get === 'function' ? iterable.get(key) : iterable[key]
            const result = callback(key, value)
            if (result === BREAK_SIGNAL) {
                break
            }
            if (!resultsOK && typeof result !== 'undefined') {
                resultsOK = true
            }
            results.push(result)
        }
        return resultsOK ? results : void []
    }

    /**
     * Get value from a struct
     * @param {struct|*} obj
     * @param {StringN} key
     * @return {*}
     */
    static get(obj, key) {
        return !obj ? void 0 : obj[key]
    }

    /**l
     *
     * @param  {Class|struct} target
     * @param  {StringN} key
     * @param {(v:any)=>any} [convertor]
     * @return {StringN}
     */
    static handleKeyname(target, key, convertor) {
        if (convertor && convertor !== nif) {
            key = convertor(key)
        }

        if (target.hasOwnProperty(key)) {
            return key
        }
        // 私有属性，访问不了
        // let privKeyname = '#' + keyname
        // if (source.hasOwnProperty(privKeyname)) {
        //     return privKeyname
        // }

        map.forEach(target, k2 => {
            // "base_url" ===> baseUrl  or  baseURL
            if (k2.toLowerCase() === key.toLowerCase()) {
                key = k2
                return BREAK_SIGNAL
            }
        })
        return key
    }

    /**
     * Insert an object into an array or update if the array already exists this object
     * @param {struct[]} objects
     * @param {struct} item
     * @param {struct} condition
     * @param {boolean} [insertToHead] the direction of the insertion. true to head, false to tail
     * @return {[]}
     */
    static insertOnDuplicateUpdate(objects, item, condition, insertToHead = false) {
        if (!item) {
            return objects
        }
        if (len(objects) === 0) {
            return [item]
        }

        // 为保证 react state 更新正常，这里 item 最好指向新的内存空间
        let newItem = {}
        map.forEach(objects[0], (key, value) => {
            newItem[key] = typeof item[key] === 'undefined' ? atype.zeroize(value) : item[key]
        })
        const [_, i] = map.find(objects, condition)
        if (i > 0) {
            objects[i] = newItem   // on duplicate update
            return objects
        }
        // JS 这种情况不会预先执行函数，而需要等判断结果后，择一执行
        insertToHead ? objects.push(newItem) : objects.unshift(newItem)
        return objects
    }

    /**
     * Join object keys and values
     * @param {iterable} iterable
     * @param {string} [kvSeparator]
     * @param {string} [separator]
     * @param {(key:StringN, value:any)=>{key:string,value:any, ok:boolean}} [hook]
     * @param {SortMethod} [sort]
     * @return {string}
     */
    static join(iterable, kvSeparator = '=', separator = '&', hook = null, sort = true) {
        kvSeparator = typeof kvSeparator !== 'string' ? '=' : kvSeparator
        separator = typeof separator !== 'string' ? '&' : separator
        let s = ''
        map.forEach(iterable, (key, value) => {
            if (hook) {
                const {k, v, ok} = hook(key, value)
                if (!ok) {
                    return
                }
                key = k
                value = v
            }
            value = string(value)
            s += separator + key + kvSeparator + value
        }, sort)
        return s ? s.slice(separator.length) : s
    }

    /**
     * Create a struct with one property
     * @param pairs
     * @return {struct}
     */
    static kv(...pairs) {
        let o = {}
        if (pairs.length % 2 !== 0) {
            throw new TypeError('map.kv() parameters must be in pairs')
        }
        for (let i = 0; i < pairs.length; i += 2) {
            o[pairs[i]] = pairs[i + 1]
        }
        return o
    }

    /**
     * Merge the contents of two objects together into the first object based on the properties of the first object
     * @description 以第一个对象target的属性为基础，使用后面sources对象与target相同属性名覆盖，抛弃sources对象多余属性值。常用于配置文件填充
     * @param {Class|struct} target A --> 会污染 target。 target 可以是struct，也可以是class.
     * @param {Class|struct} source B
     * @param {(v:any)=>any} [keynameConvertor]
     * @return {Class|struct}   A = A  ∪ (A ∩ B)
     */
    static merge(target, source, keynameConvertor) {
        map.forEach(source, (k, v) => {
            if (keynameConvertor) {
                k = map.handleKeyname(target, k, keynameConvertor)
            }
            // 定义不存在undefined。undefined当作特殊情况过滤；
            if (typeof v !== "undefined" && target.hasOwnProperty(k)) {
                target[k] = v
            }
        })
        return target
    }

    /**
     * Overwrite the target object's content with source object based on the target object's properties,
     *      and zeroize the target object's properties before overwriting.
     * @description 将两个对象的交集填充进target，将target其他属性设为零值。通常重新填充配置target。
     * @param {Class|struct} target A --> 会污染 target。
     * @param {struct}  source B --> probably it's a configuration struct ，后者往往是配置项，覆盖掉前者
     * @param {function} keynameConvertor convert properties' field names in source object
     * @return {Class|struct} A = (A ∩ B) ∪ zeroize(A)
     */
    static overwrite(target, source, keynameConvertor) {
        if (!target || !source) {
            return target
        }
        let fields = target.hasOwnProperty('_fields_') && target._fields_ ? target._fields_ : target.constructor['_fields_'] ? target.constructor['_fields_'] : null
        map.forEach(source, (k, v) => {
            if (keynameConvertor) {
                k = map.handleKeyname(target, k, keynameConvertor)
            }
            if (k === '_fields_' || !target.hasOwnProperty(k)) {
                return
            }
            // filter by target._fields_
            if (fields && !fields.includes(k) && !fields.includes(k)) {
                return
            }

            if (typeof v === "undefined") {
                target[k] = atype.zeroize(target[k])
            } else {
                target[k] = typeof target[k] === "number" ? number(v) : v
            }
        })
        return target
    }

    /**
     * 解析json或{} 为 {}
     * @param {struct|FormData|jsonstr} obj
     * @returns {struct}
     */
    static parse(obj) {
        if (!obj) {
            return {}
        }
        if (obj instanceof FormData) {
            let o = {}
            for (const pair of obj.entries()) {
                o[pair[0]] = pair[1]
            }
            return obj
        }
        if (typeof obj === "object") {
            return obj
        }
        try {
            return JSON.parse(obj)
        } catch (e) {
            console.error("invalid new map object", obj)
        }
        return {}
    }

    /**
     * Set item into a struct
     * @param {struct|*} obj
     * @param {StringN} key
     * @param value
     * @return {{[p: string]: *}|*}
     */
    static set(obj, key, value) {
        obj = struct(obj)
        obj[key] = value
        return obj
    }

    /**
     * Set if not exists
     * @param obj
     * @param key
     * @param value
     */
    static setNotExist(obj, key, value) {
        if (!obj) {
            return map.kv(key, value)
        }
        if (typeof obj[key] === 'undefined') {
            obj[key] = value
        }
        return obj
    }

    /**
     * Merge two objects into a new object
     * @description 合并两个对象属性，若出现相同属性，则后者b的该属性覆盖前者a的该属性。若想相反覆盖，则调换位置即可
     * @param {struct} target A
     * @param {struct} source B
     * @param {(v:any)=>any} [keynameConvertor]
     * @returns {struct}      C = A ∪ B
     */
    static spread(target, source, keynameConvertor) {
        target = struct(target)
        source = struct(source)
        if (!keynameConvertor) {
            return Object.assign({}, target, source)// 等同于{...target, ...source}
        }
        let obj = Object.assign({}, target)

        map.forEach(source, (k, v) => {
            if (keynameConvertor) {
                k = map.handleKeyname(target, k, keynameConvertor)
            }
            obj[k] = v
        })
        return obj
    }

    /**
     * Merge the contents of two objects together into the first object based on the properties and their types of the first object
     * @description 以第一个对象target的属性为基础，使用后面sources对象与target相同属性名且值类型相同的覆盖，抛弃sources对象多余属性值
     *      常用于配置文件填充
     * @param {Class|struct} target A --> 会污染 target。 target 可以是struct，也可以是class.
     * @param {struct}  source B
     * @param {(v:any)=>any} [keynameConvertor]
     * @return  {Class|struct}     A = A ∪ (|A| ∩ |B|)
     */
    static strictMerge(target, source, keynameConvertor) {
        map.forEach(source, (k, v) => {
            if (keynameConvertor) {
                k = map.handleKeyname(target, k, keynameConvertor)
            }
            if (typeof v === "undefined" || !target.hasOwnProperty(k)) {
                return
            }
            let t = target[k]
            // type consistency, except undefined/null (unknown type)
            if (typeof t === "undefined" || t === null || v === null || typeof v === typeof t) {
                target[k] = v
            }
        })
        return target
    }

}