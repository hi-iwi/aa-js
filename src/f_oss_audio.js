
//@TODO
class AaAudioSrc {
    name = 'aa-audio-src'

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
