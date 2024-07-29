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

    // aaFetch 层会处理该数据
    toJSON() {
        return this.path
    }
}
