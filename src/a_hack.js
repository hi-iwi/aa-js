class AaHack {
    name = "aa-hack"

    /**
     * 根据类名字符串实例化类
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
     * 根据类名和方法名字符串调用静态方法
     * @param {string} className
     * @param {string} methodName
     * @param {string|number|boolean|*} args
     * @return {any}
     * @throws {TypeError}
     */
    static callStaticMethod(className, methodName, ...args) {
        let c = AaHack.class(className)
        if (typeof c[methodName] !== 'function') {
            throw new TypeError(`Method ${className}.${methodName} is not a static function`);
        }
        return c[methodName](...args)
    }

    /**
     * 检查字符串是否为可调用的静态方法
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