class arrays {
    /**
     * Concat multiple arrays into a new array
     * @param {any[][]} args
     * @return {*[]}
     */
    static concat(...args) {
        let result = []
        args.map(v => {
            if (!v || v.length === 0) {
                return
            }
            for (let i = 0; i < v.length; i++) {
                result.push(v[i])
            }
        })
        return result
    }

    /**
     * Concat items with same properties
     * @param {struct[]} a
     * @param {struct[]} b
     * @param {string|string[]} [keys]
     * @return {struct[]}
     */
    static concatItems(a, b, ...keys) {
        if (len(a) === 0) {
            return b
        }
        if (len(b) === 0) {
            return a
        }

        if (len(keys) === 0) {
            return a.concat(b)
        }
        keys = keys.length === 1 && Array.isArray(keys[0]) ? keys[0] : keys
        let c = []
        // 去掉 a 不符合条件的数据
        a.map(item => {
            if (item && map.containAll(item, keys)) {
                c.push(item)
            }
        })

        b.map(item => {
            if (!item || !map.containAll(item, keys)) {
                return
            }
            for (let i = 0; i < a.length; i++) {
                if (map.compareProps(a[i], item, keys)) {


                    return
                }
            }
            c.push(item)
        })
        return c
    }

    /**
     * Is the array contains this item
     * @param {any[]} arr
     * @param {any} item
     * @return {boolean}
     */
    static contains(arr, item) {
        if (!arr) {
            return false
        }
        for (let i = 0; i < arr.length; i++) {
            let a = arr[i]
            if (a instanceof RegExp) {
                if (a.test(string(item))) {
                    return true
                }
                continue
            }
            if (item === a) {
                return true
            }
        }
        return false
    }

    /**
     * Range from start to end
     * @param {number} start
     * @param {number} end
     * @param {number} step
     * @param {(i:number)=>*} callback
     * @return {string}
     */
    static range(start, end, step, callback) {
        step = Math.abs(step)
        if (start < end) {
            for (let i = start; i < end; i += step) {
                const r = callback(i)
                if (r === BREAK) {
                    return BREAK
                }
            }
        }
        for (let i = start; i > end; i -= step) {
            const r = callback(i)
            if (r === BREAK) {
                return BREAK
            }
        }
    }

    /**
     * Shuffle an array
     * @param {any[]} arr
     */
    static shuffle(arr) {
        let currentIndex = arr.length, randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex !== 0) {
            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [arr[currentIndex], arr[randomIndex]] = [
                arr[randomIndex], arr[currentIndex]];
        }

        return arr;
    }


}