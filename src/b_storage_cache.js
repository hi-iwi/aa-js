class _aaCache {
    name = 'aa-cache'
    // @type _aaStorage
    #storage

    constructor(storage) {
        this.#storage = storage
    }

    tableName(table) {
        return 'aa_db_' + table
    }

    keyname(table, key) {
        return this.tableName(table) + '.' + key
    }

    // pattern {is://, not:/(^_)|(_total)/} -->
    /**
     * Save data into table
     * @param {string} table
     * @param {map|{[key:string]:any}} data
     * @param {string|RegExp} pattern
     * @param {boolean} [persistent]
     */
    save(table, data, pattern, persistent = false) {
        const is = defval(pattern, 'is')
        const not = defval(pattern, 'not')
        data = new map(data)
        data.forEach((key, value) => {
            let keyname = this.keyname(table, key)
            // 这个要放在最前面，抵消默认忽视下划线结尾的临时变量规则
            if ((typeof is === "string" && key === is) || (is instanceof RegExp && is.test(key))) {
                this.#storage.setItem(keyname, value, persistent)
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
            this.#storage.setItem(keyname, value, persistent)
        })
    }

    /**
     * Drop a table and its data
     * @param table
     */
    drop(table) {
        const tableName = this.tableName(table)
        this.#storage.removeItems(new RegExp("^" + tableName))
    }

    data(table) {
        const tableName = this.tableName(table)
        return this.#storage.getItems(new RegExp("^" + tableName))
    }

}