class arrays {

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