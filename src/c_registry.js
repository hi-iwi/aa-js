/**
 * Registry
 */
class AaRegistry {
    name = 'aa-registry'

    #registers = {}

    constructor() {
    }

    /**
     * Activate a registered module
     * @param {string} name
     * @param args
     * @return {null|*}
     */
    activate(name, ...args) {
        if (typeof this.#registers[name] === "function") {
            return this.#registers[name](...args)
        }
        log.error("miss register " + name)
        return null
    }

    /**
     * Register a method
     * @param {string} name
     * @param method
     */
    register(name, method) {
        panic.errorType(name, 'string')
        panic.errorType(method, 'function')
        this.#registers[name] = method
    }

    /**
     * Unregister a method
     * @param {string} name
     */
    unregister(name) {
        delete (this.#registers[name])
    }
}