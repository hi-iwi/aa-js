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
     * Is the array contains this item
     * @param {(StringN|RegExp|boolean)[]} arr
     * @param {StringN|boolean} item
     * @return {boolean}
     */
    static contains(arr, item) {
        if (arr) {
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
                if (r === BREAK_SIGNAL) {
                    return BREAK_SIGNAL
                }
            }
        }
        for (let i = start; i > end; i -= step) {
            const r = callback(i)
            if (r === BREAK_SIGNAL) {
                return BREAK_SIGNAL
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