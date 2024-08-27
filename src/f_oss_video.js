//@TODO
class AaVideoSrc  extends AaSrc{
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
    /**
     * @override
     * @type {string|void}
     */
    jsonkey

    constructor() {
        super()
    }
    // aaFetch 层会处理该数据
    toJSON() {
        return this.path
    }
    serialize() {

    }
    /**
     * @param {str} str
     * @return {AaVideoSrc}
     * @note compatible with this.serialize()
     */
    static unserialize(str) {

    }
}
