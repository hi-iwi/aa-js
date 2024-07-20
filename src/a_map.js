// 自定义map类型  参考 Map
class map {
    name = 'aa-map'
    object // {{[key:string]:*} | string}


    get size() {
        return this.keys().length
    }

    // 不用报错，正常人也不会这么操作
    // set size(value) {
    //     throw new SyntaxError("map.size is readonly")
    // }

    /**
     * @param {{[key:string]:*} | string} o
     */
    constructor(o = {}) {
        this.build(o)
    }

    build(o) {
        this.object = map.parse(o)
    }

    /**
     * 解析json或{} 为 {}
     * @param obj
     * @returns {{}|*}
     */
    static parse(obj) {
        if (!obj) {
            return {}
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
     * 深度复制一个对象
     * @param obj
     * @returns {any}
     */
    static clone(obj) {
        return JSON.parse(JSON.stringify(obj))
    }

    /**
     * Merge the contents of two or more objects together into the first object based on the properties of the first object
     * @description 以第一个对象target的属性为基础，使用后面sources对象与target相同属性名覆盖，抛弃sources对象多余属性值
     *      常用于配置文件填充
     * @param {{[key:string]:*}} target --> 会污染 target。 target 可以是struct，也可以是class.
     * @param {[{[key:string]:*}]}  sources
     * @return {*} 注意配置属性固定的doc文档写法，所以这里返回通用对于doc兼容性最佳
     */
    static merge(target, ...sources) {
        for (let i = 0; i < sources.length; i++) {
            let src = sources[i]
            if (!src) {
                continue
            }
            for (let [k, v] of Object.entries(src)) {
                // 定义不存在undefined。undefined当作特殊情况过滤；
                if (typeof v !== "undefined" && target.hasOwnProperty(k)) {
                    target[k] = v
                }
            }
        }

        return target
    }

    /**
     * Merge the contents of two or more objects together into the first object based on the properties and their types of the first object
     * @description 以第一个对象target的属性为基础，使用后面sources对象与target相同属性名且值类型相同的覆盖，抛弃sources对象多余属性值
     *      常用于配置文件填充
     * @param {object|{[key:string]:*}} target --> 会污染 target。 target 可以是struct，也可以是class.
     * @param {{[key:string]:*}}  sources
     * @return {*}  注意配置属性固定的doc文档写法，所以这里返回通用对于doc兼容性最佳
     */
    static strictMerge(target, ...sources) {
        for (let i = 0; i < sources.length; i++) {
            let src = sources[i]
            if (!src) {
                continue
            }
            for (let [k, v] of Object.entries(src)) {
                if (typeof v === "undefined" || !target.hasOwnProperty(v)) {
                    continue
                }
                let t = target[k]
                // type consistency, except undefined/null (unknown type)
                if (typeof t === "undefined" || t === null || v === null || typeof v === typeof t) {
                    target[k] = v
                }
            }
        }

        return target
    }

    /**
     * Merge two or more objects into a new object
     * @description 合并两个对象属性，若出现相同属性，则后者b的该属性覆盖前者a的该属性。
     *      若想相反覆盖，则调换位置即可
     * @param {{[key:string]:*}} a
     * @param {{[key:string]:*}} b
     * @returns {{[key:string]:*}}   这里往往无法判断属性，因此返回结构固定
     */
    static spread(a, b) {
        return {...a, ...b}   //  {...a, ...b, ...c} === Object.assign({}, a, b, c)
    }


    /**
     * Overwrite the target object's content with source object based on the target object's properties,
     *      and zeroize the target object's properties before overwriting.
     * @param {object|{[key:string]:*}} target --> 会污染 target。
     * @param {{[key:string]:*}}  source   --> probably it's a configuration struct ，后者往往是配置项，覆盖掉前者
     * @param {function} keynameConvertor convert properties' field names in source object
     */
    static overwrite(target, source, keynameConvertor) {
        let fields = target._fields_ ? target._fields_ : target.constructor['_fields_'] ? target.constructor['_fields_'] : null
        for (let [k, v] of Object.entries(source)) {
            let keyname = typeof keynameConvertor === "function" ? keynameConvertor(k) : k
            if (!target.hasOwnProperty(keyname)) {
                for (let [k2, v2] of Object.entries(target)) {
                    // "base_url" ===> baseUrl  or  baseURL
                    if (k2.toLowerCase() === k.toLowerCase()) {
                        keyname = k2
                        break
                    }
                }
            }
            if (!target.hasOwnProperty(keyname)) {
                continue
            }

            // filter by target._fields_
            if (fields && !fields.includes(k) && !fields.includes(keyname)) {
                continue
            }

            if (typeof v === "undefined") {
                target[keyname] = atype.zeroize(target[keyname])
            } else {
                target[keyname] = typeof target[keyname] === "number" ? number(v) : v
            }
        }
        return target
    }

    /**
     * Sort this map
     * @return {map}
     */
    sort() {
        let ks = this.keys().sort();
        let sortedObj = {};
        for (let i = 0; i < ks.length; i++) {
            sortedObj[ks[i]] = this.object[ks[i]];
        }
        this.object = sortedObj
        return this
    }

    toString() {
        return JSON.stringify(this.object)
    }

    toQueryString(assert) {
        let params = [];
        this.forEach((k, v) => {
            if (k === "" || typeof v === "undefined" || v === null) {
                return
            }
            if (typeof assert === "function" && assert(k, v)) {
                return
            }
            v = encodeURIComponent(string(v))
            params.push(k + '=' + v)
        })
        return params.join('&')
    }


    entries() {
        return Object.entries(this.object)
    }

    forEach(callback) {
        // 这种方式forEach 中进行删除未遍历到的值是安全的
        for (let [k, v] of this.entries()) {
            callback(k, v)
        }
    }

    has(key, allowUndefined = false) {
        return this.object.hasOwnProperty(key) && (allowUndefined || typeof this.object[key] != "undefined")
    }

    get(key, cast = string) {
        let v = this.has(key) ? this.object[key] : void 0
        return cast(v)
    }

    keys() {
        return Object.keys(this.object)
    }

    values() {
        return Object.values(this.object)
    }

    clear() {
        this.object = {}
    }

    delete(key) {
        delete this.object[key]
    }

    set(key, value) {
        if (!key) {
            return
        }
        this.object[key] = value
    }

    getOrSet(key, defaultValue, allowUndefined = false) {
        if (!this.has(key, allowUndefined)) {
            this.set(key, defaultValue)
        }
        return this.get(key)
    }

    extend(obj) {
        if (!obj || typeof obj !== "object") {
            return this
        }
        for (let [k, v] of Object.entries(obj)) {
            this.set(k, v)
        }
        return this
    }

    // 深度复制
    clone() {
        return new map(map.clone(this.object))
    }

}