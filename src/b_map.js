/**
 * @import atype
 */

// 自定义map类型  参考 Map
class map {
    name = 'aa-map'

    props

    // len() 函数会识别这个
    len() {
        return this.keys().length
    }

    /**
     * @param {struct|FormData|jsonstr} props
     */
    init(props) {
        if (!props) {
            this.props = {}
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
     * Sort this map
     * @return {map}
     */
    sort() {
        let ks = this.keys().sort();
        let sortedObj = {};
        for (let i = 0; i < ks.length; i++) {
            sortedObj[ks[i]] = this.props[ks[i]];
        }
        this.props = sortedObj
        return this
    }

    toString() {
        return JSON.stringify(this.props)
    }

    toQueryString(assert, sort = true) {
        let params = [];
        this.forEach((key, value) => {
            if (typeof value === "function") {
                value = string(value)
            }
            if (value === "" || typeof key === "undefined" || key === null) {
                return
            }
            if (typeof assert === "function" && assert(key, value)) {
                return
            }

            if (Array.isArray(key)) {
                key = key.join(",")  // url param，数组用逗号隔开模式
            }
            key = encodeURIComponent(string(key))
            params.push(value + '=' + key)
        }, sort)
        return params.join('&')
    }


    entries() {
        return Object.entries(this.props)
    }

    /**
     *
     * @param {IteratorCallback} callback
     * @param sort
     */
    forEach(callback, sort = false) {
        // 这种方式forEach 中进行删除未遍历到的值是安全的
        if (!sort) {
            for (let [key, value] of this.entries()) {
                callback(key, value)
            }
            return
        }
        let keys = this.keys().sort()
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i]
            callback(key, this.get(key))
        }
    }

    has(key, allowUndefined = false) {
        return this.props.hasOwnProperty(key) && (allowUndefined || typeof this.props[key] != "undefined")
    }

    /**
     * Get from map
     * @param {string} key
     * @param {(value:any)=>any} [cast]
     * @return {*}
     */
    get(key, cast) {
        let v = this.has(key) ? this.props[key] : void 0
        return typeof cast === 'function' ? cast(v) : v
    }

    keys() {
        return Object.keys(this.props)
    }

    values() {
        return Object.values(this.props)
    }

    clear() {
        this.props = {}
    }

    delete(key) {
        delete this.props[key]
    }

    set(key, value) {
        if (!key) {
            return
        }
        this.props[key] = value
    }

    setObject(obj) {
        if (!obj) {
            return
        }
        for (const [key, value] of Object.entries(obj)) {
            this.props[key] = value
        }
    }

    /**
     *
     * @param {map|struct} obj
     */
    extend(obj) {
        if (obj instanceof map) {
            obj.forEach((key, value) => {
                this.set(key, value)
            })
            return this
        }
        if (!obj || typeof obj !== "object") {
            return this
        }
        for (let [key, value] of Object.entries(obj)) {
            this.set(key, value)
        }
        return this
    }

    getOrSet(key, defaultValue, allowUndefined = false) {
        if (!this.has(key, allowUndefined)) {
            this.set(key, defaultValue)
        }
        return this.get(key)
    }


    // 深度复制
    clone(deep = true) {
        let obj = deep ? map.clone(this.props) : {...this.props}
        return new map(obj)
    }

    /**
     * Create a struct with one property
     * @param key
     * @param value
     * @return {struct}
     */
    static kv(key, value) {
        let o = {}
        o[key] = value
        return o
    }

    static set(obj, key, value) {
        obj = struct(obj)
        obj[key] = value
        return obj
    }

    static get(obj, key) {
        return !obj ? void 0 : obj[key]
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
     * Clone an object 深度复制一个对象；浅复制，就自行  newObj  = {...obj}
     * @param obj
     * @returns {any}
     */
    static clone(obj) {
        return obj ? JSON.parse(JSON.stringify(obj)) : obj
    }

    /**
     *
     * @param  {Class|struct} source
     * @param  {struct} keyname
     * @param {(v:any)=>any} [convertor]
     * @return {string|*}
     */
    static handleKeyname(source, keyname, convertor) {
        if (typeof convertor === 'function' && convertor !== nif) {
            keyname = convertor(keyname)
        }

        if (source.hasOwnProperty(keyname)) {
            return keyname
        }

        let privKeyname = '#' + keyname

        if (source.hasOwnProperty(privKeyname)) {
            return privKeyname
        }
        for (let [k2, _] of Object.entries(source)) {
            // "base_url" ===> baseUrl  or  baseURL
            if (k2.toLowerCase() === keyname.toLowerCase()) {
                return k2
            }
        }
        return keyname
    }

    /**
     * Merge the contents of two objects together into the first object based on the properties of the first object
     * @description 以第一个对象target的属性为基础，使用后面sources对象与target相同属性名覆盖，抛弃sources对象多余属性值。常用于配置文件填充
     * @param {Class|struct} target A --> 会污染 target。 target 可以是struct，也可以是class.
     * @param {struct} source B
     * @param {(v:any)=>any} [keynameConvertor]
     * @return {Class|struct}   A = A  ∪ (A ∩ B)
     */
    static merge(target, source, keynameConvertor) {
        for (let [k, v] of Object.entries(struct(source))) {
            if (typeof keynameConvertor === 'function') {
                k = map.handleKeyname(target, k, keynameConvertor)
            }
            // 定义不存在undefined。undefined当作特殊情况过滤；
            if (typeof v !== "undefined" && target.hasOwnProperty(k)) {
                target[k] = v
            }
        }
        return target
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
        for (let [k, v] of Object.entries(struct(source))) {
            if (typeof keynameConvertor === 'function') {
                k = map.handleKeyname(target, k, keynameConvertor)
            }
            if (typeof v === "undefined" || !target.hasOwnProperty(k)) {
                continue
            }
            let t = target[k]
            // type consistency, except undefined/null (unknown type)
            if (typeof t === "undefined" || t === null || v === null || typeof v === typeof t) {
                target[k] = v
            }
        }
        return target
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
        if (typeof keynameConvertor !== 'function') {
            return Object.assign(target, source)
        }
        for (let [k, v] of Object.entries(source)) {
            if (typeof keynameConvertor === 'function') {
                k = map.handleKeyname(target, k, keynameConvertor)
            }
            target[k] = v
        }
        return target
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
        if (typeof keynameConvertor !== 'function') {
            return Object.assign({}, target, source)// 等同于{...target, ...source}
        }
        let obj = Object.assign({}, target)

        for (let [k, v] of Object.entries(source)) {
            if (typeof keynameConvertor === 'function') {
                k = map.handleKeyname(target, k, keynameConvertor)
            }
            obj[k] = v
        }
        return obj
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
        if (typeof handler !== "function") {
            handler = (k, v, target) => {
                if (typeof target[k] === "undefined") {
                    target[k] = v
                }
            }
        }
        for (let [k, v] of Object.entries(defaults)) {
            handler(k, v, target, defaults)
        }
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
        for (let [k, v] of Object.entries(source)) {
            if (typeof keynameConvertor === 'function') {
                k = map.handleKeyname(target, k, keynameConvertor)
            }
            if (k === '_fields_' || !target.hasOwnProperty(k)) {
                continue
            }
            // filter by target._fields_
            if (fields && !fields.includes(k) && !fields.includes(k)) {
                continue
            }

            if (typeof v === "undefined") {
                target[k] = atype.zeroize(target[k])
            } else {
                target[k] = typeof target[k] === "number" ? number(v) : v
            }
        }
        return target
    }

    /**
     * Whether object contains all of these elements
     * @param {map|struct} obj
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
            for (const [k, v] of Object.entries(target)) {
                if (!map.compare(v, src[k])) {
                    return false
                }
            }
        }
        return target === src
    }
}