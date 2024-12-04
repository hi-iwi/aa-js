/**
 * 延迟指定时间后解析的 Promise
 * @param {TimeUnixMs} timeout
 * @param params
 * @return {Promise<number>}
 */
function asleep(timeout, ...params) {
    return new Promise(resolve => setTimeout(resolve, timeout, ...params))
}

/**
 * 在 Promise 原型上添加 asleep 方法
 * @param {TimeUnixMs} timeout
 * @return {Promise<number>}
 */
Promise.prototype.asleep = function (timeout) {
    return this.then((...params) => asleep(timeout, ...params));
}

/**
 * 立即解析的 Promise
 * @param {any} data
 * @return {Promise<any>}
 */
function APromiseResolve(data) {
    return Promise.resolve(data)
}

/**
 * 立即拒绝的 Promise
 * @param {any} err
 * @return {Promise<never>}
 */
function APromiseReject(err) {
    const error = !err || typeof err === "string" 
        ? aerror(AErrorEnum.ClientThrow, err) 
        : aerror(err);
    return Promise.reject(error);
}


