class _aaRegistry {
    name = 'aa-registry'

    #registers = {}

    constructor() {
    }

    register(name, method) {
        if (typeof method !== "function") {
            throw new TypeError(`registry only accept callable method, but ${name} get ${atype.of(method)}`)
        }
        this.#registers[name] = method
    }

    /**
     * Activate a registered module
     * @param name
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

    unregister(name) {
        delete (this.#registers[name])
    }
}