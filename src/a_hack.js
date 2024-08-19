class AaHack {

    static class(className) {
        if (typeof window === 'object' && typeof window[className] === 'object') {
            return window[className]
        }
        if (typeof global === 'object' && typeof global[className] === 'object') {
            return global[className]
        }
        try {
            return new Function(`return ${className}`)()
        } catch (err) {
        }
        throw new TypeError(`class ${className} is not found`)
    }

    /**
     * @param {string} className
     * @param {string} methodName
     * @param {string|number|boolean|*} args
     */
    static callStaticMethod(className, methodName, ...args) {
        let c = AaHack.class(className)
        return c[methodName](...args)
    }

    /**
     * @param {string} className
     * @param {string} methodName
     */
    static staticCallable(className, methodName) {
        try {
            let c = AaHack.class(className)
            return typeof c[methodName] === 'function'
        } catch (err) {
            return false
        }
    }
}