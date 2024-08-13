/**
 * @typedef {{is?:string|RegExp|(string|RegExp)[], not?:string|RegExp|(string|RegExp)[]}} AaCachePattern
 */
class AaCache {
    name = 'aa-cache'

    /** @type {AaStorageEngine} */
    #storageEngine

    /**
     *
     * @param {AaStorageEngine} storageEngine
     */
    constructor(storageEngine) {
        panic.errorType(storageEngine, AaStorageEngine)
        this.#storageEngine = storageEngine
    }

    /**
     *
     * @param {string} table
     * @return {string}
     */
    #formatTableName(table) {
        return ['aa', 'db', table].join(this.#storageEngine.separator)
    }

    #formatKeyname(table, key) {
        return this.#formatTableName(table) + this.#storageEngine.subSeparator + key
    }

    #unformatKeyname(key) {
        let prefix = ['aa', 'db', ''].join(this.#storageEngine.separator)
        if (key.indexOf(prefix) !== 0) {
            return key
        }
        key = key.replace(prefix, '')
        const sub = this.#storageEngine.subSeparator
        let keys = key.split(sub)
        if (keys.length === 1) {
            return key
        }
        return keys.slice(1).join(sub)
    }

    // pattern {is://, not:/(^_)|(_total)/} -->
    /**
     * Save data into table
     * @param {string} table
     * @param {map|struct} data
     * @param {AaCachePattern} [pattern]
     * @param {StorageOptions} [options]
     */
    save(table, data, pattern, options) {
        const is = defval(pattern, 'is')
        const not = defval(pattern, 'not')
        data = new map(data)
        data.forEach((key, value) => {
            let keyname = this.#formatKeyname(table, key)
            // 这个要放在最前面，抵消默认忽视下划线结尾的临时变量规则
            if (key === is || (is instanceof RegExp && is.test(key))) {
                this.#storageEngine.setItem(keyname, value, options)
                return
            }
            if (Array.isArray(is)) {
                for (let i = 0; i < is.length; i++) {
                    if (key === is[i] || (is[i] instanceof RegExp && is[i].test(key))) {
                        this.#storageEngine.setItem(keyname, value, options)
                        return
                    }
                }
            }


            // 以_结尾的表示临时数据，不用缓存
            // 避免客户端缓存state，直接将 _onPaste_, xxx_ok_ 的元素 加进来
            if (key.slice(-1) === '_') {
                return
            }
            if (key === not || (not instanceof RegExp && not.test(key))) {
                return
            }

            if (Array.isArray(not)) {
                for (let i = 0; i < not.length; i++) {
                    if (key === not[i] || (not[i] instanceof RegExp && not[i].test(key))) {
                        return
                    }
                }
            }

            this.#storageEngine.setItem(keyname, value, options)
        })
    }

    /**
     * Drop table
     * @param table
     */
    drop(table) {
        const tableName = this.#formatTableName(table)
        this.#storageEngine.removeItems(new RegExp("^" + strings.escapeReg(tableName)))
    }

    /**
     * Select from table
     * @param {string} table
     * @param {[string]} [fields]
     * @return {*}
     */
    selectAll(table, fields) {
        if (!table) {
            throw new TypeError(`storage cache error: select * from ${table}`)
        }
        let pattern = this.#formatTableName(table) + strings.escapeReg(this.#storageEngine.subSeparator)
        if (len(fields) > 0) {
            pattern += '(' + fields.join('|') + ')$'
        }
        let data = this.#storageEngine.getItems(new RegExp("^" + pattern))
        if (!data) {
            return null
        }
        let items = {}
        for (const [k, v] of Object.entries(data)) {
            let key = this.#unformatKeyname(k)
            items[key] = v
        }
        return items
    }

    /**
     * Find from table
     * @param {string} table
     * @param {string|RegExp} field
     * @return {string|*|null}
     */
    find(table, field) {
        if (!table || !field) {
            throw new TypeError(`storage cache error: select ${field} from ${table}`)
        }
        let key = this.#formatKeyname(table, field)
        return this.#storageEngine.getItem(key)
    }


}