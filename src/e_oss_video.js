//@TODO
class _aaVideoSrc {
    name = 'aa-video-src'

    process
    path
    filetype
    ext
    size
    width
    height
    allowed

    // aaFetch 层会处理该数据
    toJSON() {
        return this.path
    }
}
