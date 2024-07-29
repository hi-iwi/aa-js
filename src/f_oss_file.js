
//@TODO
class AaFileSrc {
    name = 'aa-file-src'

    provider
    path
    filetype
    size
    checksum
    info


    // 提供给 string() 用
    toString() {
        return this.path
    }
    // aaFetch 层会处理该数据
    toJSON() {
        return this.path
    }
}
