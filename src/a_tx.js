// a simple transaction lock
let _aaTxIncr_ = 0

class AaTx {
    id
    lock  // bool, 锁状态
    timer // 超时自动解锁

    static atomicId() {
        return ++_aaTxIncr_
    }


    constructor() {
        this.id = AaTx.atomicId()
        this.lock = false
        this.timer = null
    }

    log(msg) {
        let dbg = false
        if (dbg) {
            log.info("#" + this.id + " " + msg)
        }
    }

    notFree() {
        return this.lock
    }

    isFree() {  // 是否空闲
        return !this.notFree()
    }


    begin(timeout) {
        this.log('Begin')
        this.lock = true  // BEGIN 事务开启
        timeout = typeof timeout === "undefined" ? 10000 : uint32(timeout)  // 默认10秒超时解锁
        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
            log.warn("tx timeout")
            this.lock = false
        }, timeout)
    }

    commit() {
        this.log('Commit')
        clearTimeout(this.timer)
        this.lock = false // COMMIT 事务结束
    }

    rollback() {
        this.log('Rollback')
        clearTimeout(this.timer)
        this.lock = false  // ROLLBACK 事务结束
    }

    unmount() {
        this.log('Unmount')
        clearTimeout(this.timer)
    }
}