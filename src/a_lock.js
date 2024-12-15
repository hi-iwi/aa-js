// a simple lock
let _aaLockIncr_ = 0

class AaLock {
    name = 'aa-lock'

    static debug = false

    #id = AaLock.atomicId()
    #lockAt = 0 // number, 锁状态
    #timer // 超时自动解锁
    #timeout = 5000  // 5 seconds


    constructor() {
    }

    destroy() {
        this.log('Destroy lock')
        this.#clearTimer()
    }

    /**
     * Check current lock is locked
     * @return {boolean}
     * @note 如果单纯依赖setTimeOut清理，则可能因为故障而导致无法清理，因此采用这种双重保障方案
     */
    isLocked() {
        return this.#lockAt > 0 && (this.#lockAt + this.#timeout > Date.now())
    }

    /**
     * Lock
     * @param {number} [timeout] in millisecond
     * @return {boolean} the result of locking
     */
    lock(timeout) {
        if (this.isLocked()) {
            return false
        }

        this.log('Lock')
        this.#lockAt = Date.now()  // BEGIN 事务开启
        timeout = number(timeout)
        if (timeout > 0) {
            this.#timeout = timeout
        } else {
            timeout = this.#timeout
        }
        this.#setAutoUnlockTimer(timeout)
        return true
    }


    unlock() {
        this.log('Unlock')
        this.#clearTimer()
        this.#lockAt = 0
    }

    /**
     * Lock and return the opposite result to this.lock()
     * @param {number} [timeout] in millisecond
     * @return {boolean} the opposite result of locking
     */
    xlock(timeout) {
        return !this.lock(timeout)
    }
    /**
     * 获取锁的状态信息
     * @returns {Object} 锁的状态信息
     */
    getStatus() {
        return {
            id: this.#id,
            isLocked: this.isLocked(),
            lockAt: this.#lockAt,
            timeout: this.#timeout,
            remainingTime: this.#lockAt > 0 ? Math.max(0, this.#lockAt + this.#timeout - Date.now()) : 0
        };
    }

    /**
     * 异步等待锁释放
     * @param {number} [maxWaitTime=5000] 最大等待时间（毫秒）
     * @returns {Promise<boolean>} 是否成功等待到锁释放
     */
    async waitForUnlock(maxWaitTime = 5000) {
        const startTime = Date.now();

        while (this.isLocked()) {
            if (Date.now() - startTime > maxWaitTime) {
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return true;
    }

    static atomicId() {
        return ++_aaLockIncr_
    }
    /**
     * 清除定时器
     * @private
     */
    #clearTimer() {
        if (this.#timer) {
            clearTimeout(this.#timer);
            this.#timer = null;
        }
    }
    log(msg) {
        if (AaLock.debug) {
            log.debug("#" + this.#id + " " + msg)
        }
    }
    /**
     * 设置自动解锁定时器
     * @private
     * @param {number} timeout 超时时间
     */
    #setAutoUnlockTimer(timeout) {
        this.#clearTimer();
        this.#timer = setTimeout(() => {
            this.log(`Lock timeout (${timeout}ms)`);
            this.#lockAt = 0;
        }, timeout);
    }

}