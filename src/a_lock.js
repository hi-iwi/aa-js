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

    // 如果单纯依赖setTimeOut清理，则可能因为故障而导致无法清理，因此采用这种双重保障方案
    isLocked() {
        return this.#lockAt > 0 && (this.#lockAt + this.#timeout > Date.now())
    }

    isFree() {
        return !this.isLocked()
    }


    /**
     * Start transaction
     * @param {number} [timeout] in millisecond
     */
    lock(timeout) {
        this.log('Begin')
        this.#lockAt = Date.now()  // BEGIN 事务开启
        timeout = number(timeout)
        if (timeout > 0) {
            this.#timeout = timeout
        } else {
            timeout = this.#timeout
        }
        clearTimeout(this.#timer)
        this.#timer = setTimeout(() => {
            this.log(`Timeout (${timeout}ms)`)
            this.#lockAt = 0
        }, timeout)
    }

    unlock() {
        this.log('Unlock')
        clearTimeout(this.#timer)
        this.#lockAt = 0
    }



    destroy() {
        this.log('Destroy')
        clearTimeout(this.#timer)
    }

    log(msg) {
        if (AaLock.debug) {
            log.debug("#" + this.#id + " " + msg)
        }
    }

    static atomicId() {
        return ++_aaLockIncr_
    }
}