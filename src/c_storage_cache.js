class AaCache {
    name = 'aa-cache'

    // @type {AaStorageEngine}
    #storageEngine

    /**
     *
     * @param {AaStorageEngine} storageEngine
     */
    constructor(storageEngine) {
        this.#storageEngine = storageEngine
    }

    formatTableName(table) {
        return ['aa', 'db', table].join(this.#storageEngine.separator)
    }

    formatKeyname(table, key) {
        return this.formatTableName(table) + this.#storageEngine.subSeparator + key
    }

    unformatKeyname(key) {
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
     * @param {map|{[key:string]:any}} data
     * @param {string|RegExp} pattern
     * @param {struct} [options]
     */
    save(table, data, pattern, options) {
        const is = defval(pattern, 'is')
        const not = defval(pattern, 'not')
        data = new map(data)
        data.forEach((value, key) => {
            let keyname = this.formatKeyname(table, key)
            // 这个要放在最前面，抵消默认忽视下划线结尾的临时变量规则
            if ((typeof is === "string" && key === is) || (is instanceof RegExp && is.test(key))) {
                this.#storageEngine.setItem(keyname, value, options)
                return
            }

            // 以_结尾的表示临时数据，不用缓存
            // 避免客户端缓存state，直接将 _onPaste_, xxx_ok_ 的元素 加进来
            if (key.slice(-1) === '_') {
                return
            }
            if ((typeof not === "string" && key === not) || (not instanceof RegExp && not.test(key))) {
                return
            }
            this.#storageEngine.setItem(keyname, value, options)
        })
    }

    /**
     * Drop table
     * @param table
     */
    drop(table) {
        const tableName = this.formatTableName(table)
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
            throw new RangeError(`storage cache error: select * from ${table}`)
        }
        let pattern = this.formatTableName(table) + strings.escapeReg(this.#storageEngine.subSeparator)
        if (len(fields) > 0) {
            pattern += '(' + fields.join('|') + ')$'
        }
        let data = this.#storageEngine.getItems(new RegExp("^" + pattern))
        if (!data) {
            return null
        }
        let items = {}
        for (const [k, v] of Object.entries(data)) {
            let key = this.unformatKeyname(k)
            items[key] = v
        }
        return items
    }

    find(table, field) {
        if (!table || !field) {
            throw new RangeError(`storage cache error: select ${array(field).join(',')} from ${table}`)
        }
        let key = this.formatKeyname(table, field)
        return this.#storageEngine.getItem(key)
    }


}