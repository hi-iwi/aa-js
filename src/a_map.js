// 自定义map类型  参考 Map
class map {
    name = 'aa-map'
    object // {{[key:string]:*} | string}


    get size() {
        return this.keys().length
    }

    set size(value) {
        throw new SyntaxError("map.size is readonly")
    }

    /**
     * @param {{[key:string]:*} | string} o
     */
    constructor(o = {}) {
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
     * Merge Objects
     * @description 以第一个对象target的属性为基础，使用后面sources对象与target相同属性名覆盖，抛弃sources对象多余属性值
     *      常用于配置文件填充
     * @param {{[key:string]:*}} target --> 会污染 target
     * @param {{[key:string]:*}}  sources
     * @return {*} 注意配置属性固定的doc文档写法，所以这里返回通用对于doc兼容性最佳
     */
    static merge(target, ...sources) {
        if (!target) {
            return target
        }
        for (let [k, v] of Object.entries(target)) {
            for (let i = 0; i < sources.length; i++) {
                let src = sources[i]
                if (!src) {
                    continue
                }
                if (typeof src[k] !== "undefined") {
                    target[k] = src[k]
                }
            }
        }
        return target
    }

    /**
     * Strict Merge Objects
     * @description 以第一个对象target的属性为基础，使用后面sources对象与target相同属性名且值类型相同的覆盖，抛弃sources对象多余属性值
     *      常用于配置文件填充
     * @param {{[key:string]:*}} target --> 会污染 target
     * @param {{[key:string]:*}}  sources
     * @return {*}  注意配置属性固定的doc文档写法，所以这里返回通用对于doc兼容性最佳
     */
    static strictMerge(target, ...sources) {
        if (!target) {
            return target
        }
        for (let [k, v] of Object.entries(target)) {
            for (let i = 0; i < sources.length; i++) {
                let src = sources[i]
                if (!src) {
                    continue
                }
                // 相同属性、值类型相同
                if (typeof src[k] === typeof v) {
                    target[k] = src[k]
                }
            }
        }
        return target
    }

    /**
     * Spread Objects
     * @description 合并两个对象属性，若出现相同属性，则后者b的该属性覆盖前者a的该属性。
     *      若想相反覆盖，则调换位置即可
     * @param {{[key:string]:*}} a
     * @param {{[key:string]:*}} b
     * @returns {{[key:string]:*}}   这里往往无法判断属性，因此返回结构固定
     */
    static spread(a, b) {
        return {...a, ...b}   //  {...a, ...b, ...c} === Object.assign({}, a, b, c)
    }

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