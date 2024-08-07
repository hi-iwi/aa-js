/**
 * Multi-level dropdowns(selects) data 多级联动数据
 * 多个 <select></select><select></select> 组合
 */
class AaMultiLevelSelects {


    /**
     *  @property {{value:any, text:string, key?:number, pid?:number, prefix?:any, suffix?:any, inherit?:boolean, comment?:any, virtual?:boolean}}[][]} #data
     *      value: 选项的值
     *      text: 文本
     *      key: 0,
     *      pid:0,
     *     inherit: bool, 如果为true，下级会增加一个选项

     *     prefix: string 选取显示的时候，在text前面加的字符    特殊情况：<f8 f803>  select 组件会转义成  <i class="f8 f803"></i> 之类的
     * suffix: 选取显示时候，在text后面加的字符 特殊情况：<fi fi32>  select 组件会转义成  <i class="fi fi32"></i> 之类的
     *
     * comment: 注释
     * virtual:bool   是否虚拟，虚拟的就不显示
     * @example [[{key:1, value:99, text:'Tom'},{key:0, value:100, text:'Aario'}],[{value:'China', text:'China'}]]
     *  <select><option key="1" value="99">Tom</option><option key="0" value="100">Aario</option></select>
     *  <select><option value="China">China</option></select>
     */
    #data
    get data() {
        return this.#data ? this.#data : [[]]
    }

    get first() {
        return this.#data[0]
    }


    get last() {
        return this.len > 0 ? this.#data[this.len - 1] : null
    }

    get len() {
        return this.#data ? this.#data.length : 0
    }


    // 格式化，并按 key 排序数组（如果设置了key）
    // 将 {$value:$text,$value:$text} 或 [{$value:$text},{$value:$text}] 或 [text, text]
    // 或 [{value:, text:}, {value:, text:}]
    // // 统一为 [[{value:, text:}, {value:, text:}]]
    // @param cast function  int8 ...
    // @param inherit bool  是否每个下级都把上级加上去
    /**
     *
     * @param {struct|struct[][]|struct[]|any[]} opts
     * @param {(value:any)=>any} [cast]
     * @param {boolean}[inherit]
     */
    constructor(opts, cast, inherit = false) {
        if (len(opts) === 0) {
            return
        }
        // [{value:, text:}], {value:, text:}]

        // 过滤掉  [[{value:, text:}], {value:, text:}]] ，即正常情况
        if (!Array.isArray(opts[0])) {
            //  {$value:$text,$value:$text} 或 [{$value:$text},{$value:$text}] 或 [text, text]
            if (!opts[0] || !opts[0].hasOwnProperty('value') || !opts[0].hasOwnProperty('text')) {
                let options = [[]]
                //  [{$value:$text},{$value:$text}] 或 [text, text]
                if (Array.isArray(opts)) {
                    for (let i = 0; i < opts.length; i++) {
                        if (atype.isStruct(opts[i])) {
                            let v = Object.keys(opts[i])[0]
                            options[0].push({
                                value: v,
                                text : opts[i][v]
                            })
                        } else {
                            options[0].push({
                                value: i,
                                text : opts[i]
                            })
                        }
                    }

                } else {
                    //  $value:$text,$value:$text}
                    for (let v in opts) {
                        if (opts.hasOwnProperty(v)) {
                            options[0].push({
                                value: v,
                                text : opts[v]
                            })
                        }
                    }
                }
                opts = options
            } else {
                // 这种情况[{value:, text:}], {value:, text:}]
                opts = [opts]
            }
        }
        let v = void ''
        let t = void ''
        let tt = void ''
        let z = void {}
        let pid = void null
        // 按key排序，及转化数据格式
        // 转化 inherit
        for (let i = 0; i < opts.length; i++) {
            for (let j = 0; j < opts[i].length; j++) {
                z = opts[i][j]
                if (bool(z, '_formatted')) {
                    continue
                }

                v = z.value
                t = z.text
                // @warn  任何层级都不能出现 value 重复，但是text不同的情况。允许出现 value 重复、text 相同的情况（如省市 深圳、广州前置）
                for (let k = 0; k < i; k++) {
                    for (let n = 0; n < opts[k].length; n++) {
                        tt = opts[k][n].text
                        if (v === opts[k][n].value && string(t) !== string(tt)) {
                            console.error("AaSelect: conflict\n    " + JSON.stringify(opts[k][n]) + "\n    " + JSON.stringify(opts[i][j]))
                        }
                    }
                }

                opts[i][j]._formatted = true
                if ((inherit || bool(z, 'inherit')) && i < opts.length - 1) {
                    opts[i][j].inherit = false
                    let x = map.clone(opts[i][j])
                    x.pid = v
                    x.key = -1
                    opts[i + 1].unshift(x)
                }

                // 转换类型
                if (typeof cast === "function") {
                    opts[i][j].value = cast(v)
                    pid = typeof opts[i][j].pid !== "undefined" ? void null : opts[i][j].pid
                    if (typeof pid !== "undefined" && pid !== "" && pid !== null) {
                        opts[i][j].pid = cast(pid)
                    }
                }

                // 排序
                for (let k = j; k > 0; k--) {
                    let a = int32(opts[i][k - 1], 'key')  // key 可以为负数
                    let b = int32(opts[i][k], 'key')
                    if (a > b) {
                        let tmp = opts[i][k]
                        opts[i][k] = opts[i][k - 1]
                        opts[i][k - 1] = tmp
                    }
                }
            }
        }
        this.#data = opts
    }


    clone() {
        let newData = this.#data ? strings.unjson(JSON.stringify(this.#data)) : null
        return new AaMultiLevelSelects(newData)
    }

    // 通过value，找到系列{}。由于可能出现某个子元素，前置（如深圳、广州前置到省），而同时子选项又包括。从子项选中后，展示前置项
    findChainOptions(value) {
        if (this.len === 0) {
            return []
        }
        let pid = void ""
        let chain = []

        this.forEach((opts, i) => {
            if (!pid) {
                for (let j = 0; j < opts.length; j++) {
                    // 空value，就选择第一个
                    if (!value || string(value) === string(opts[j].value)) {
                        pid = opts[j].pid
                        chain.unshift(opts[j])
                        break
                    }
                }
            } else {
                for (let j = 0; j < opts.length; j++) {
                    const sj = opts[j]
                    // 判定是否前置
                    if (string(value) === string(opts[j].value)) {
                        pid = sj.pid
                        chain = [sj]  // 重置 family
                        break
                    }
                    if (string(sj.value) === string(pid)) {
                        pid = sj.pid
                        chain.unshift(sj)
                        break
                    }
                }
            }
        }, DECR)


        // 如果不是从最后一个选择，那么后面的默认选第一个
        if (chain.length === 0 && len(this.#data) > 0 && len(this.#data[0]) > 0) {
            chain.push(this.#data[0][0])
            // 该value没有找到，就默认选
        }

        for (let i = chain.length; i < this.len; i++) {
            this.forEachOption((option, selectIndex, optionIndex) => {
                // 默认选符合条件的子选项第一个
                if (option.pid === chain[i - 1].value) {
                    chain.push(option)
                    return
                }
                // 如果多项选择，但是某个元素没有子选项，那么就增加虚拟子选项
                let g = {...chain[chain.length - 1]}
                g.pid = g.value
                chain.push(g)
            }, i)
        }


        return chain
    }

    /**
     *
     * @param {number|string} value
     * @param {boolean} [showFull]
     * @param {string} [separator]
     * @param {(obj:struct, key:string)=>string} [prefixHandler]
     * @return {{prefix: string, pid: *, text: string, suffix: string, value}|{prefix: string, text: string, suffix: string, value}}
     */
    findText(value, showFull, separator, prefixHandler) {
        const chain = this.findChainOptions(value)
        let pid = void ""
        let text = ""
        let prefix = ""
        let suffix = ""

        if (len(chain) === 0) {
            return {
                value : value,
                text  : "",
                prefix: "",
                suffix: "",
            }
        }
        if (string(chain[len(chain) - 1], 'value') === "") {
            return {
                value : value,
                text  : "",
                prefix: "",
                suffix: "",
            }
        }

        for (let i = 0; i < chain.length; i++) {
            if (chain[i].value === chain[i].pid) {
                break
            }
            pid = chain[i].pid
            if (pid === chain[i].value) {
                pid = void ""
            }
            let prefix = ''
            let suffix = ''

            if (prefixHandler) {
                prefix = prefixHandler(chain[i], 'prefix')
                suffix = prefixHandler(chain[i], 'suffix')
            }

            // 显示全部，且没有  virtual:true 字段
            if (showFull && not(chain[i], 'virtual')) {
                if (text !== "" && separator) {
                    text += separator
                }
                text += chain[i].text
            } else {
                text = chain[i].text
            }
        }
        return {
            value : value,
            pid   : pid,
            text  : text,
            prefix: prefix,
            suffix: suffix,
        }
    }


    forEach(callable, incr = INCR) {
        let result = []
        if (this.len === 0) {
            return result
        }
        const start = incr === INCR ? 0 : this.len - 1
        const end = incr === INCR ? this.len : -1
        range(start, end, 1, i => {
            const r = callable(this.nth(i), i)
            if (r === BREAK_SIGNAL) {
                return r
            }
            result.push(r)
        })
        return result
    }

    /**
     *
     * @param {function} callable
     * @param {number} [selectIndex]
     * @param {boolean} [selectsIncr]
     * @param {boolean} [optionsIncr]
     * @return {*[]}
     */
    forEachOption(callable, selectIndex, selectsIncr = INCR, optionsIncr = INCR) {
        let result = []
        if (typeof selectIndex === 'undefined' || selectIndex === null) {
            this.forEach((options, i) => {
                const start = optionsIncr === INCR ? 0 : options.length - 1
                const end = optionsIncr === INCR ? options.length : -1
                return range(start, end, 1, j => {
                    const r = callable(options[j], i, j)
                    if (r === BREAK_SIGNAL) {
                        return r
                    }
                    result.push(r)
                })
            }, selectsIncr)
            return result
        }
        if (selectIndex >= this.len) {
            throw RangeError(`unshiftOption selectIndex ${selectIndex} is out of the max index ${this.len - 1}  of all selects`)
        }
        const options = this.nth(selectIndex)
        for (let j = 0; j < options.length; j++) {
            const r = callable(options[j], selectIndex, j)
            if (r === BREAK_SIGNAL) {
                break
            }
            result.push(r)
        }
        return result
    }


    nth(i) {
        return this.#data[i]
    }

    shiftOptionFrom(selectIndex) {
        if (selectIndex >= this.len) {
            throw RangeError(`unshiftOption selectIndex ${selectIndex} is out of the max index ${this.len - 1}  of all selects`)
        }
        this.#data[selectIndex].shift()
    }

    unshiftOptionTo(selectIndex, option) {
        if (selectIndex >= this.len) {
            throw RangeError(`unshiftOption selectIndex ${selectIndex} is out of the max index ${this.len - 1}  of all selects`)
        }
        this.#data[selectIndex].unshift(option)
    }


    // value:text 更符合实际，比如  {86:"中国"}
    // 将 {value:text, value:text} 或[{value:text},{value:text}] [{value:, text:},{value:, text:}]  转为 [value]
    static extractChainValues(option) {
        let a = []
        let w = void null
        if (atype.isStruct(option)) {
            for (let b in option) {
                if (option.hasOwnProperty(b)) {
                    a.push(b)
                }
            }
        } else {
            for (let i = 0; i < option.length; i++) {
                w = option[i]
                if (atype.isStruct(w)) {
                    if (w.hasOwnProperty('value')) {
                        w = w.value
                    } else {
                        w = Object.keys(w)[0]
                    }
                }
                a.push(w)
            }
        }
        return a
    }

}