class AaArchive {
    /** @type {AaCache} */
    db
    tableName
    #pattern
    #options

    /**
     * @param {Class|function|string|*} tableName
     * @param {AaCache} db
     * @param {AaCachePattern} [pattern]
     * @param {StorageOptions} [options]
     */
    constructor(tableName, db, pattern, options) {
        this.db = db
        this.tableName = AaArchive.createTableName(tableName)
        this.#pattern = pattern
        this.#options = options
    }

    drop() {
        this.db.drop(this.tableName)
    }

    load() {
        return this.db.selectAll(this.tableName)
    }

    /**
     * Save
     * @param {struct} state
     */
    save(state) {
        this.db.save(this.tableName, state, this.#pattern, this.#options)
    }

    /**
     * @param {Class|function|string|*} tableName
     * @return {string}
     */
    static createTableName(tableName) {
        if (typeof tableName === 'string') {
            return tableName
        }
        let selfName = tableName.name ? tableName.name : tableName.constructor.name
        const parentName = Object.getPrototypeOf(tableName.constructor).name
        const path = location.pathname.replace(/[\/\\]/g, '_')
        selfName = !selfName || selfName === 'Function' ? '' : selfName + '_'
        return `${selfName}${parentName}${path}`
    }
}