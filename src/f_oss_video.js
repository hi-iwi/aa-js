//@TODO
class AaVideoSrc {
    name = 'aa-video-src'

    provider
    pattern
    origin
    path
    preview
    filetype
    size
    width
    height
    duration
    allowed
    jsonkey


    // aaFetch 层会处理该数据
    toJSON() {
        return this.path
    }
}
