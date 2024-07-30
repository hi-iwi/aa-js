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

    jsonkey



    // aaFetch 层会处理该数据
    toJSON() {
        let key = this.jsonkey && this.hasOwnProperty(this.jsonkey) ? this.jsonkey : 'path'
        return this[key]
    }
}
