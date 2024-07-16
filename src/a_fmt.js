// 基础static class
class fmt {
    /**
     * Format string with specified formats
     * @param {string} format
     *  %s string
     * @param args
     * @return {string}
     */
    static sprintf(format, ...args) {
        let matches = [...format.matchAll(/%s/g)]
        if (matches.length !== args.length) {
            log.error(`fmt.sprintf("${format}", ${args})  invalid number of arguments, expected ${matches.length}, but get ${args.length}.`)
        }

        for (let i = 0; i < matches.length; i++) {
            if (args.length - 1 < i) {
                break
            }
            format = format.replace(matches[i][0], args[i])
        }
        return format
    }

    /**
     * Translate formatted string
     * @param {{[key:string]:string}|null} dictionary
     * @param args
     * @return {string}
     * @example fmt.translate({'I LOVE %s':'我爱%s'}, "I LOVE %s", "你")    ===>   我爱你
     */
    static translate(dictionary, ...args) {
        if (args.length < 1) {
            return ""
        }
        let format = dictionary && dictionary[args[0]] ? dictionary[args[0]] : args[0]
        return fmt.sprintf(format, ...args.slice(1))
    }

}