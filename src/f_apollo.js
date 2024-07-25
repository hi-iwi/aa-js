/**
 * @import _aaFetch
 * @typedef {{[key:string]:any}} struct
 */

class _aaApollo {
    name = 'aa-apollo'

    // @type _aaFetch
    #fetcher
    #fingerprintGenerator
    #loginDataHandler
    // @type _aaStorage
    #storage

    paramName = aparam.Apollo //  参数名 --> 阿波罗计划
    url
    apollo


    /**
     *
     * @param {_aaFetch} fetcher
     * @param {string} url
     * @param {(fp:string)=>void} fingerprintGenerator 设备唯一码生成器
     * @param {(data:struct)=>void} loginDataHandler 登录处理
     * @param {_aaStorage} storage
     */
    constructor(fetcher, url, fingerprintGenerator, loginDataHandler, storage) {
        this.#fetcher = fetcher
        this.url = url
        this.#fingerprintGenerator = fingerprintGenerator
        this.#loginDataHandler = loginDataHandler
        this.#storage = storage
        this.apollo = storage.getItem(this.paramName)  // 初始化获取
        this.check()
        this.fetch()
    }


    get(readStorage = false) {
        if (readStorage) {
            return this.#storage.getItem(this.paramName)
        }
        return this.apollo
    }

    set(apollo) {
        this.apollo = apollo
        this.#storage.setItem(this.paramName, apollo)
    }

    fetch() {
        const apollo = this.get()
        if (!apollo) {
            return
        }
        this.#fetcher.get(this.url, {"apollo": apollo}).then(data => {
            if (!data['apollo']) {
                log.error("fetch " + this.url + " response invalid")
                return
            }
            if (this.get() !== data['apollo']) {
                log.debug("change apollo " + this.get() + " to " + data['apollo'])
                this.set(data['apollo'])
            }
        }).catch(err => {
            err.log()
        })
    }

    check(done = apollo => void 0) {
        let apollo = this.get()
        if (apollo) {
            done(apollo)
            return
        }

        this.#fingerprintGenerator((fingerprint) => {
            let info = {
                "psid" : fingerprint,
                "dpw"  : Math.ceil(window.screen.height * window.devicePixelRatio),  // 物理分辨率宽度
                "dph"  : Math.ceil(window.screen.width * window.devicePixelRatio), // 物理分辨率高度
                "dip_w": window.screen.width,  // 逻辑分辨率宽度
            }
            apollo = _aaApollo.Encode(info)
            this.set(apollo)
            done(apollo)
        })
    }


//Base64编码可用于在HTTP环境下传递较长的标识信息。例如，在Java Persistence系统Hibernate中，就采用了Base64来将一个较长的一个标识符（一般为128-bit的UUID）编码为一个字符串，用作HTTP表单和HTTP GET URL中的参数。在其他应用程序中，也常常需要把二进制数据编码为适合放在URL（包括隐藏表单域）中的形式。此时，采用Base64编码不仅比较简短，同时也具有不可读性，即所编码的数据不会被人用肉眼所直接看到。
//然而，标准的Base64并不适合直接放在URL
// Encode 将标准base64 替换  + ==> -    / ==> _ ，并且不使用 = 填充
// 浏览器通过user-agent可以默认传递很多值，就不用重复传了；浏览器不用传：info、UA
//  1. 取一个区间为[A-Z]的cipher字符，swapRange =  (cipher.ascii码 & 1) + 1
//  2. 获取时间戳 timestamp=TIMESTAMP, 8位随机字符串 nonce= rand.String() ；拼接进对象
//  3. 将对象转换为 url 传值（按key随机排序即可），注意进行 url encode  --> 不含 UA ，得到 q = "timestamp=xxx&psid=xx&udid=xxx&nonce=xxx"  如果值为空，则不参与编码
//  4. 取q长度中间位置，mid = len(q) / 2 ，ceil 取中间，保证后半段一定长于或等长于前半段
//  5. 从1位开始，每swapRange位，对m1位置右侧相应位置交换，得到q = swap(q)
//  6. 使用url友好型base64编码， 得到 b =  base64.RawURLEncoding.Encode(&b, q)
//  7. 取 b 长度中间位置， mid = len(b) / 2 ，ceil 取中间，保证后半段一定长于或等长于前半段
//  8. 从0位开始，每swapRange位，对mid位置右侧相应位置交换
//  9. 首位放上cipher字符，接上上面的字符串
// 调用频繁，越快越好，不要浪费算力

    static _genRandStr(length = 8) {
        const min = parseInt('1'.padEnd(length, '0'), 36)   // 保持该长度最小随机数值
        const seed = min % 999999999
        return (Math.round(Math.random() * seed) + min).toString(36).substring(0, length)
    }


    // static TestGenRandStr() {
    //     for (let i = 0; i < 10000000; i++) {
    //         let s = __aaBaseAppollo.genRandStr(8)
    //         if (s.length !== 8) {
    //             console.error("bad: " + s)
    //             return false
    //         }
    //     }
    //     console.log("OK")
    // }

    static Encode(info) {
        let cipher = 'A'
        let swapRange = (cipher.charCodeAt(0) & 1) + 1
        info.timestamp = new Date().getTime()
        info.nonce = _aaApollo._genRandStr(8)

        // 屏幕逻辑宽带 window.screen.height * window.devicePixelRatio

        let qs = ""
        for (const [key, value] of Object.entries(info)) {
            let v = encodeURIComponent('' + value)
            if (v !== "" && v !== "0") {
                qs += "&" + key + "=" + v
            }
        }
        qs = qs.substring(1)
        let qq = qs.split('')
        let mid = Math.ceil(qq.length / 2)
        for (let i = 1; i < mid; i += swapRange) {
            [qq[i], qq[mid + i]] = [qq[mid + i], qq[i]]
        }
        qs = qq.join('')
        // 系统base64编码
        let b = window.btoa(qs).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/, "").split('')
        mid = Math.ceil(b.length / 2)

        for (let i = 0; i < mid; i += swapRange) {
            [b[i], b[mid + i]] = [b[mid + i], b[i]]
        }
        return cipher + b.join('')
    }

    // static Decode(s) {
    //     if (s.length === 0) {
    //         return null
    //     }
    //     let cipher = s[0]
    //     let swapRange = (cipher.charCodeAt(0) & 1) + 1
    //     let b = s.substring(1).split('')
    //     let mid = Math.ceil(b.length / 2)
    //     for (let i = 0; i < mid; i += swapRange) {
    //         [b[i], b[mid + i]] = [b[mid + i], b[i]]
    //     }
    //     let qq = window.atob(b.join('').replace(/-/g, "+").replace(/_/g, "/")).split('')
    //     mid = Math.ceil(qq.length / 2)
    //     for (let i = 1; i < mid; i += swapRange) {
    //         [qq[i], qq[mid + i]] = [qq[mid + i], qq[i]]
    //     }
    //     let q = new URLSearchParams(qq.join(''))
    //     return Object.fromEntries(q)
    // }
}