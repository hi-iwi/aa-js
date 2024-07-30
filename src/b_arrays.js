class arrays {
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