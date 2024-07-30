function asleep(timeout, ...params) {
    return new Promise(resolve => setTimeout(resolve, timeout, ...params))
}

Promise.prototype.asleep = function (timeout) {
    return this.then((...params) => {
        return asleep(timeout, ...params)
    });
}


function APromiseResolve(data) {
    return new Promise((resolve, reject) => {
        resolve(data)
    })
}

function APromiseReject(err) {
    return new Promise((_, reject) => {
        err = !err || typeof err === "string" ? aerror(AErrorEnum.ClientThrow, err) : aerror(err)
        reject(err)
    })
}