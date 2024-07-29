
//@TODO
class AaFileSrc {
    name = 'aa-file-src'

    provider
    path
    filetype
    size
    checksum
    info

    // aaFetch 层会处理该数据
    toJSON() {
        return this.path
    }
}
