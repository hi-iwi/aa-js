/** @typedef {function(scrollTop, prevScrollTop, autoScroll:bool)} Condition */
/** @typedef {function(scrollTop, prevScrollTop, autoScroll:bool)} Trigger */
/** @typedef {{condition: Condition|null, trigger: Trigger, pause: boolean}} Event */

class AaScrollEvent {
    /** @type {Map} */
    #events


    onAutoScrolling = false   // 是否在触发自动
    prevScrollTop = 0


    constructor() {
        this.#events = new Map()
    }

    listen() {
        document.addEventListener('scroll', e => {
            aa.scrollEvent.fire(window.scrollY)
        })
    }

    isAtTop(scrollTop, prevScrollTop, autoScroll) {
        scrollTop-- // errors caused by decimals
        return scrollTop <= prevScrollTop && scrollTop < 1
    }

    isAtBottom(scrollTop, prevScrollTop, autoScroll) {
        // $(document).height()  =  $(window).scrollTop() + $(window).height()
        // 这个一定要是动态的！！！列表刷新之后， $(document).height() 是会变得
        // 如果文章有图片未加载，那么 $(document).height() 会随图片加载一直变化
        scrollTop++    // errors caused by decimals
        const b = AaEnv.documentHeight() - window.innerHeight - 200   // 200 像素优化用户体验，临底部就开始拉取新的列表
        return scrollTop >= prevScrollTop && scrollTop >= b
    }


    isAtClientBottom(scrollTop, prevScrollTop, scrollHeight, clientHeight) {
        // react target
        scrollTop++  // +1 小数导致的边界问题
        const b = scrollHeight - clientHeight
        return scrollTop >= prevScrollTop && scrollTop >= b
    }


    /**
     * Register a scroll event
     * @param name
     * @param {?Condition} [condition]
     * @param {Trigger} trigger
     * @param {boolean} [pause]
     */
    register(name, condition, trigger, pause) {
        const events = this.#events
        if (events.get(name)) {
            log.error(`register scroll event ${name} repeatedly`)
            return
        }
        this.#events.set(name, {
            condition: condition,
            trigger  : trigger,
            pause    : bool(pause)
        })
    }

    registerAtBottom(name, trigger, pause) {
        this.register(name, this.isAtBottom, trigger, pause)
    }

    registerAtTop(name, trigger, pause) {
        this.register(name, this.isAtTop, trigger, pause)
    }

    unregister(name) {
        this.#events.delete(name)
    }

    pause(name) {
        const events = this.#events.get(name)
        if (!events) {
            log.debug('pausing a non-existent scroll event ' + name)
            return
        }
        events.pause = true
    }

    unpause(name) {
        const events = this.#events.get(name)
        if (!events) {
            log.debug('unpausing a non-existent scroll event ' + name)
            return
        }
        events.pause = false
    }

    isAuto(scrollTop, prevScrollTop) {
        return Math.abs(scrollTop - prevScrollTop) < 5
    }

    fire(scrollTop) {
        let prevScrollTop = this.prevScrollTop
        this.onAutoScrolling = Math.abs(scrollTop - prevScrollTop) > 10   // 每次滑动大于10px，就应该是自动滑动，或者快速滑动
        const isAuto = this.isAuto(scrollTop, prevScrollTop)
        let e = {}

        //@param {Event} event
        this.#events.forEach((event, name) => {
            if (event.pause) {
                return CONTINUE
            }
            if (event.condition && event.condition(scrollTop, prevScrollTop, isAuto)) {
                return CONTINUE
            }
            event.trigger(scrollTop, prevScrollTop, isAuto)
        })

        this.prevScrollTop = scrollTop
    }

    // 当点击事件时， currentClientY 为当前鼠标点击位置；但是不会执行 onDrageStart，也就没有 prevClientY
    dragDistance(currentClientY, prevClientY) {
        if (typeof prevClientY === "undefined") {
            return 0
        }
        return currentClientY - prevClientY
    }

    isDragAtTop(scrollTop, distance) {
        // disdance 长按击的点，距离起始点位置 > 表示往下拉
        if (distance < 50) {  // 至少要拖拽50像素
            return
        }
        scrollTop--  // -1 小数导致的边界问题
        return scrollTop < 1
    }

}