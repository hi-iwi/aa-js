// 基础static class
class fmt {
    name = 'aa-fmt'

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

    /**
     * Convert UPPER_UNDERSCORE_CASE/PascalCase/camelCase/kebab-case to snake case(underscore_case)
     * @param s
     */
    static toSnakeCase(s) {
        s = s.replace(/-/g, '_')  // kebab-case
        let isPascal = s && (s[0] >= 'A' && s[0] <= 'Z')

        s = s.replace(/_?([A-Z]+)/g, function (x, y) {
            return "_" + y.toLowerCase()
        })
        return isPascal ? s.replace(/^_/, "") : s

    }

    /**
     * Capitalize the first letter of each word and leave the other letters lowercase
     * @param {string} s  separate words with spaces, underscore(_) or hyphen(-)
     * @param handleCases
     */
    static capitalizeEachWord(s, handleCases = false) {
        if (handleCases) {
            s = fmt.toSnakeCase(s).replace(/_/g, ' ')
        }
        s = s.replace(/(^|[\s_-])([a-z])/g, function (x, y, z) {
            return y + z.toUpperCase()
        })
        return s
    }

    /**
     * Convert to sentence-case
     */
    static toSentenceCase(s, handleCases = false) {
        if (handleCases) {
            s = fmt.toSnakeCase(s).replace(/_/g, ' ')
        }
        return !s ? "" : s[0].toUpperCase() + s.substring(1)
    }
}