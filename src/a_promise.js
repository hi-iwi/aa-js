function asleep(timeout, ...params) {
    return new Promise(resolve => setTimeout(resolve, timeout, ...params))
}

Promise.prototype.asleep = function (timeout) {
    return this.then((...params) => {
        return asleep(timeout, ...params)
    });
}


function APromiseResolve(...args) {
    return new Promise((resolve, reject) => {
        resolve(...args)
    })
}

function APromiseReject(...args) {
    return new Promise((_, reject) => {
        reject(...args)
    })
}