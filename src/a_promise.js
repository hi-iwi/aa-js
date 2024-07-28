function asleep(timeout, ...params) {
    return new Promise(resolve => setTimeout(resolve, timeout, ...params))
}

Promise.prototype.asleep = function (timeout) {
    return this.then((...params) => {
        return asleep(timeout, ...params)
    });
}


function APromise(data) {
    return new Promise((resolve, reject) => {
        resolve(data)
    })
}