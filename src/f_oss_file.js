//@TODO
class AaFileSrc  extends AaSrc{
    name = 'aa-file-src'



    provider
    path
    filetype
    size
    checksum
    info
    /**
     * @override
     * @type {string|void}
     */
    jsonkey
    constructor() {
        super()
    }


    // aaFetch 层会处理该数据
    toJSON() {
        let key = this.jsonkey && this.hasOwnProperty(this.jsonkey) ? this.jsonkey : 'path'
        return this[key]
    }
    serialize() {

    }
    /**
     * @param {Stringable} str
     * @return {AaFileSrc}
     * @note compatible with this.serialize()
     */
    static unserialize(str) {

    }
}
