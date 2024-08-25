//@TODO
class AaAudioSrc extends AaSrc{
    name = 'aa-audio-src'


    provider
    pattern
    origin
    path
    filetype
    size
    duration
    /**
     * @override
     * @type {string|void}
     */
    jsonkey

    constructor() {
        super()
    }
    data() {
        return {

        }
    }
    // aaFetch 层会处理该数据
    toJSON() {
        let key = this.jsonkey && this.hasOwnProperty(this.jsonkey) ? this.jsonkey : 'path'
        return this[key]
    }

    serialize() {
        return strings.json(this.data())
    }

    /**
     * @param {Stringable} str
     * @return {AaAudioSrc}
     * @note compatible with this.serialize()
     */
    static unserialize(str) {

    }
}
