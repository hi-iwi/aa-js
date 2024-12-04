class AaHack {
    name = "aa-hack"

    /**
     * 根据类名实例化类
     * @param {string} className
     * @return {Class}
     * @throws {TypeError}
     */
    static class(className) {
        if (typeof window === 'object' && typeof window[className] === 'object') {
            return new window[className]()
        }
        if (typeof global === 'object' && typeof global[className] === 'object') {
            return new global[className]()
        }
        try {
            return new Function(`return ${className}`)()
        } catch (err) {
            throw new TypeError(`class ${className} is not found`)
        }
    }

    /**
     * Call the static method with its name
     * @param {string} className
     * @param {string} methodName
     * @param {string|number|boolean|*} args
     * @return {any}
     * @throws {TypeError}
     */
    static callStaticMethod(className, methodName, ...args) {
        let c = AaHack.class(className)
        return c[methodName](...args)
    }

    /**
     * Check a string is callable static method
     * @param {string} className
     * @param {string} methodName
     * @return {boolean}
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