
class AaArchive {
    /** @type {AaCache} */
    db
    tableName
    #pattern
    #options

    /**
     *
     * @param {AaCache} db
     * @param {AaCachePattern} [pattern]
     * @param {StorageOptions} [options]
     * @param {string} [tableName]
     */
    constructor(db, pattern, options, tableName) {
        this.db = db
        if (!tableName) {
            tableName = AaArchive.createTableName()
        }
        this.tableName = tableName
        this.#pattern = pattern
        this.#options = options
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

    drop() {
        this.db.drop(this.tableName)
    }

    static createTableName() {
        const selfName = this.constructor.name
        const parentName = Object.getPrototypeOf(this.constructor).name
        const path = location.pathname.replace(/[\/\\]/g, '_')
        return `${selfName}_${parentName}${path}`
    }
}