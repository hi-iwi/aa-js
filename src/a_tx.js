// a simple transaction lock
let _aaTxIncr_ = 0

class AaTX {
    name = 'aa-tx'
    #id = AaTX.atomicId()
    #lockAt = 0 // number, 锁状态
    #timer // 超时自动解锁
    #timeout = 5000  // 5 seconds


    constructor() {
    }

    // 如果单纯依赖setTimeOut清理，则可能因为故障而导致无法清理，因此采用这种双重保障方案
    notFree() {
        return this.#lockAt > 0 && (this.#lockAt + this.#timeout > Date.now())
    }

    isFree() {
        return !this.notFree()
    }


    /**
     * Start transaction
     * @param {number} [timeout] in millisecond
     */
    begin(timeout) {
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

    commit() {
        this.log('Commit')
        clearTimeout(this.#timer)
        this.#lockAt = 0 // COMMIT 事务结束
    }

    rollback() {
        this.log('Rollback')
        clearTimeout(this.#timer)
        this.#lockAt = 0  // ROLLBACK 事务结束
    }

    unmount() {
        this.log('Unmount')
        clearTimeout(this.#timer)
    }

    log(msg) {
        let dbg = false
        if (dbg) {
            log.info("#" + this.#id + " " + msg)
        }
    }

    static atomicId() {
        return ++_aaTxIncr_
    }
}