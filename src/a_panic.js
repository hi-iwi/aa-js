class panic {
    /**
     * Throw Error when it's not a typed array
     * @param {*[]} arr
     * @param {(function|RegExpConstructor|atypes)[]|function|RegExpConstructor|atypes} type
     * @param required
     * @warn 不要滥用这个，会耗费不必要的性能。对于异步获取值的时候，最好使用，比如Promise 或 registry.Register的时候，应该使用！
     * @example
     *  panic.arrayErrorType(names, 'string')
     *  panic.arrayErrorType(numbers, ['string', 'number'])
     *  panic.arrayErrorType(dates, [Date, time, 'string', 'number'])
     */
    static arrayErrorType(arr, type, required = REQUIRED) {
        if (required === OPTIONAL && (typeof arr === 'undefined' || arr === null)) {
            return
        }
        const ty = atype.of(arr)
        if (ty !== 'array') {
            const t = Array.isArray(type) ? `(${type.join('|')})` : type
            throw new TypeError(`${ty}:${arr} is not a ${t} array`)
        }
        for (let i = 0; i < arr.length; i++) {
            panic.errorType(arr[i], type)
        }
    }

    /**
     *
     * @param {boolean} when
     * @param {string} [message]
     */
    static assert(when, message) {
        if (when) {
            throw new Error(message)
        }
    }


    /**
     *
     * @param {string} type
     * @param {any} value
     * @param {string} key
     */
    static isEmpty(type, value, key) {
        if (!value) {
            throw new TypeError(`'${key}' can't be empty`)
        }
        panic.errorType(value, type)
    }

    static emptyNumber(value, key) {
        panic.isEmpty('number', value, key)
    }

    static emptyString(value, key) {
        panic.isEmpty('string', value, key)
    }
    
    /**
     * Throw Error when the value not in the list
     * @param value
     * @param {*[]|string} list
     * @param required
     * @warn 不要滥用这个，会耗费不必要的性能。对于异步获取值的时候，最好使用，比如Promise 或 registry.Register的时候，应该使用！
     * @example
     *  panic.enumError(sex, ['male', 'female'])
     */
    static enumError(value, list, required = REQUIRED) {
        if (required === OPTIONAL && (typeof value === 'undefined' || value === null)) {
            return
        }
        if (typeof list === 'string') {
            list = list.split('')
        }
        if (!list.includes(value)) {
            throw new RangeError(`${value} is not in the enum (${list.join('|')})`)
        }
    }

    /**
     * Throw Error when the value type is not matched
     * @param value
     * @param {(function|RegExpConstructor|atypes)[]|function|RegExpConstructor|atypes|object} type
     * @param {boolean} [required]
     * @param {boolean} [allowEmpty]
     * @warn 不要滥用这个，会耗费不必要的性能。对于异步获取值的时候，最好使用，比如Promise 或 registry.Register的时候，应该使用！
     * @example
     *  panic.errorType(key, 'string')
     *  panic.errorType(key, ['string','number'])
     *  panic.errorType(date, ['string', 'number', Date, time], OPTIONAL)
     */
    static errorType(value, type, required = REQUIRED, allowEmpty = true) {
        if (required === OPTIONAL && (typeof value === 'undefined' || value === null)) {
            return
        }
        if (!allowEmpty && !value) {
            throw new TypeError('empty value')
        }
        const ty = atype.of(value)
        if (typeof type === 'string') {
            if (ty !== type && typeof value !== type) {
                throw new TypeError(`${ty}:${value} is not a ${type}`)
            }
            return
        }

        /**
         * typeof not callable class/function is 'function. e.g. typeof Aa ==> 'function'
         *      instance of RightHand Right-hand side of 'instanceof' is not callable
         */
        if (typeof type === 'function') {
            if (!(value instanceof type)) {
                const v = string(value, 'name', value)
                throw new TypeError(`${ty}:${v} is not an instance of ${type.name}`)
            }
            return
        }

        if (Array.isArray(type)) {
            let matched = false
            for (let i = 0; i < type.length; i++) {
                try {
                    panic.errorType(value, type[i])
                    matched = true
                    break
                } catch (err) {
                }
            }
            if (!matched) {
                throw new TypeError(`${ty}:${value} is not in types of (${type.join('|')})`)
            }
        }
    }

}