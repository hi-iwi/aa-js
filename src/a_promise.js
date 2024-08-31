/**
 *
 * @param {TimeUnixMs} timeout
 * @param params
 * @return {Promise<number>}
 */
function asleep(timeout, ...params) {
    return new Promise(resolve => setTimeout(resolve, timeout, ...params))
}

/**
 *
 * @param {TimeUnixMs} timeout
 * @return {Promise<number>}
 */
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


