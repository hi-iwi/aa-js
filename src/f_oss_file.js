//@TODO
class AaFileSrc {
    name = 'aa-file-src'

    provider
    path
    filetype
    size
    checksum
    info

    jsonkey



    // aaFetch 层会处理该数据
    toJSON() {
        let key = this.jsonkey && this.hasOwnProperty(this.jsonkey) ? this.jsonkey : 'path'
        return this[key]
    }
}
