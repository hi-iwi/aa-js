/**
 * Ajax 包括：XMLHttpRequest 、fetch 等
 */
class _aaFetch {
    name = 'aa-fetch'
    headers = {
        'Content-Type': "application/json",
        'Accept'      : "application/json"
    }


    constructor() {
    }

    initGlobalHeaders(headers) {
        this.headers = headers
    }

    addGlobalHeaders(headers) {
        this.headers = {...this.headers, ...headers}
    }


    #makeHeaders(headers = {}) {
        // @TODO 合并
        return this.headers
    }

    async get(url, params = {}) {
        let headers = this.#makeHeaders({})
        const response = await fetch(url, {
            //method:"GET",
            headers: headers,
            // body:{},
            //cache:"default", //
            mode       : "cors",  // same-origin 同源；cors 允许跨域；no-cors; navigate
            credentials: "include", // omit 不发送cookie；same-origin 仅同源发送cookie；include 发送cookie
            redirect   : "error", // follow 自动跳转；manual 手动跳转；error 报错
            // integrity:"",
            referrerPolicy: "no-referrer",
        })
        return response.json().then(resp => {
            // 捕获返回数据，修改为 resp.data
            const err = new AError(resp['code'], resp['msg'])
            if (err.isOK()) {
                return resp['data']
            }
            throw err.addHeading(url)
        }).catch(err => {
            if (err instanceof AError) {
                throw err
            } else {
                throw  new AError(AError.ClientThrow, err.toString())
            }
        })
    }
}