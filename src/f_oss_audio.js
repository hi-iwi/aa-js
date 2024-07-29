//@TODO
class AaAudioSrc {
    name = 'aa-audio-src'

    provider
    pattern
    origin
    path
    filetype
    size
    duration


    // 提供给 string() 用
    toString() {
        return this.path
    }
    // aaFetch 层会处理该数据
    toJSON() {
        return this.path
    }
}
