// @import map
/*
                    hierarchical part
        ┌───────────────────┴───────────────────┐
                    authority             path
        ┌───────────────┴────────────┐┌───┴────┐
  abc://username:password@luexu.com:80/path/data?key=value&key2=value2#fragid1
  └┬┘   └───────┬───────┘ └───┬───┘ └┬┘           └─────────┬─────────┘└──┬──┘
scheme  user information     host     port                  query      fragm


                              opaque/path
         ┌───────────────────────────┴──────────────────────────┐
  magnet:?xt=urn:btih:LUEXU000AARIO000AI4C164EB2D8364463037ABD888      常用在磁力下载
  └──┬─┘
  scheme

                 hierarchical part
          ┌────────────────┴───────────────┐
                domain             path                query        hash(fragment)
               ┌───┴───┐    ┌───────┴───────┐ ┌──────────┴────────┐┌──┴──┐
  https://test.luexu.com:888/w/10894051115023?key=value&key2=value2#fragm0
  └─┬─┘   └─────┬──────┘ └┬┘                  └┬┘ └─┬─┘             └─┬──┘
  scheme    hostname     port           param key  param value      fragm
          └───────┬────────┘
              host
  └───────────┬────────────┘
            xhost
  └───────────┬────────────┘
            xhost 也可以表示这段，因为xhost一般保存在配置文件
            如 xhost https://a.com  也可能以后会被配置成 http://localhost/a
 */
const UrlRemoveRedirect = {redirect: null}

class AaURI {
    name = 'aa-uri'

    /** @type string */
    method = ''
    /** @type {map} */
    searchParams

    /** @type string */
    #hash  // alias to location.hash
    /** @type string */
    #hostname
    /** @type string */
    #password
    /** @type string */
    #pathname
    /** @type string */
    #port
    /** @type string e.g. {scheme:string}, https:, tcp: */
    #protocol
    /** @type string */
    #username


    /** @type boolean */
    #isTemplate = false   // is using template

    get hash() {
        const [hash, ,] = AaURI.lookup(this.#hash, this.searchParams)
        return hash
    }

    // 非80/443端口，则带上端口 如 luexu.com:8080"
    get host() {
        let hostname = this.hostname
        const protocol = this.protocol
        const port = this.port
        if (!port || (protocol === 'http:' && port === '80') || (protocol === 'https:' && this.port === '443')) {
            return hostname
        }
        return hostname + ":" + port
    }

    get hostname() {
        const [hostname, ,] = AaURI.lookup(this.#hostname, this.searchParams)
        return hostname
    }

    get href() {
        return this.toString()
    }

    // e.g. http://luexu.com
    get origin() {
        return this.protocol + "//" + this.host
    }

    get password() {
        const [password, ,] = AaURI.lookup(this.#password, this.searchParams)
        return password
    }

    get pathname() {
        const [pathname, ,] = AaURI.lookup(this.#pathname, this.searchParams)
        return pathname
    }

    get port() {
        const [port, ,] = AaURI.lookup(this.#port, this.searchParams)
        return port
    }

    get protocol() {
        const [protocol, ,] = AaURI.lookup(this.#protocol, this.searchParams)
        return protocol.toLowerCase()
    }

    get search() {
        return this.parse().search
    }


    /**
     * {method} {protocol:string}//{hostname}:{port:uint}/{path1:string}/{path2:int}#{hash}
     ① [GET|DELETE|...] //luexu.com
     ② [GET|DELETE|...] //luexu.com/hi
     ③ [GET|DELETE|...] https://luexu.com
     ④ [GET|DELETE|...] http://192.168.0.1:8080
     ⑤ [GET|DELETE|...] //localhost   --> https://localhost
     ⑥ [GET|DELETE|...] /home/me  --> https://xxx.xx/home/me
     */
    /**
     * @param {RequestURL} url
     * @param {struct} [params]
     * @param {string} [hash]
     */
    init(url = location.href, params, hash) {
        url = url.trim()  // will convert url:_aaURI to url.String()
        let method = ''
        const arr = url.split(' ')
        if (arr.length > 1) {
            method = arr[1]
            url = arr.slice(1).join(' ')
        }

        if (url.substring(0, 1) === '/') {
            if (url.substring(1, 2) === '/') {
                url = window.location.protocol + url
            } else {
                url = window.location.origin + url
            }
        }
        const u = new URL(url)
        this.method = method
        this.#hash = hash ? hash : u.hash
        this.#hostname = u.hostname
        this.#pathname = u.pathname
        this.#port = u.port
        this.#protocol = u.protocol
        this.searchParams = new map()
        this.#password = u.password
        this.#username = u.username

        for (const [key, value] of u.searchParams) {
            this.searchParams.set(key, value)
        }

        // 一定要在 queries 实例化后
        if (len(params) > 0) {
            this.setParams(params)
        }
    }

    /**
     * @param {string} url
     * @param {struct|map|URLSearchParams|*} [params]
     * @param {string} [hash]
     */
    constructor(url = window.location.href, params, hash) {
        this.init(url, params, hash)
    }


    delete(key) {
        this.searchParams.delete(key)
        return this
    }

    /**
     *
     * @param {(key:StringN,value:any)=>boolean} filter
     * @return {AaURI}
     */
    filter(filter) {
        for (const [key, value] of this.searchParams) {
            if (filter(key, value)) {
                // 这种方式forEach 中进行删除未遍历到的值是安全的
                this.searchParams.delete(key)
            }
        }
        return this
    }


    filterEmpty(empty = ['', '0', 0]) {
        return this.filter((_, value) => empty.includes(value))
    }

    has(key) {
        return this.searchParams.has(key)
    }

    /**
     * Parse lookup
     * @return {{baseUrl: string, search: string, ok: ok, queries: map, href: string, hash: string}}
     */
    parse() {
        if (!this.#protocol || !this.#hostname || !this.#port || !this.#pathname || !this.searchParams) {
            return {
                ok     : false,
                url    : '',
                baseUrl: '',
                queries: this.searchParams,
                search : '',
                hash   : '',
            }
        }
        let newQueries = this.searchParams.clone(false)

        let port = this.#port ? ':' + this.#port : ''
        let s = this.#protocol + '//' + this.#hostname + port + this.#pathname
        let baseUrl, hash, ok, ok2;
        [baseUrl, newQueries, ok] = AaURI.lookup(s, this.searchParams, newQueries)
        if (this.#hash) {
            [hash, newQueries, ok2] = AaURI.lookup(this.#hash, this.searchParams, newQueries)
            if (!ok2) {
                hash = ''
            }
        }
        let search = newQueries.toQueryString()
        if (search) {
            search = '?' + search
        }
        let href = baseUrl + search
        if (hash) {
            href += '#' + hash
        }
        return {
            ok     : ok,
            href   : href,
            baseUrl: baseUrl,
            queries: newQueries,
            search : search,
            hash   : hash,
        }
    }

    query(key, cast = string) {
        return this.searchParams.get(key, cast)
    }

    queryBool(key) {
        return this.query(key, bool)
    }

    queryBooln(key) {
        return this.query(key, booln)
    }

    queryNumber(key) {
        return this.query(key, number)
    }

    queryFloat(key) {
        return this.query(key, float64)
    }

    queryInt(key) {
        return this.query(key, int32)
    }

    queryUint(key) {
        return this.query(key, uint32)
    }

    set(key, value) {
        this.searchParams.set(key, value)
        return this
    }

    /**
     *
     * @param {struct|map|URLSearchParams} params
     * @return {AaURI}
     */
    setParams(params) {
        const iter = typeof params.entries === 'function' ? params.entries() : Object.entries(params)
        for (const [key, value] of iter) {
            this.searchParams.set(key, value)
        }
        return this
    }

    /**
     * Sort this map
     * @param {(a:any,b:any)=>number} [compareFn]
     * @return {AaURI}
     */
    sort(compareFn) {
        this.searchParams.sort(compareFn)
        return this
    }

    toJSON() {
        return this.toString()
    }

    toString() {
        return this.parse().href
    }

    // 多次转码后，解析到底
    /**
     * Decode an url or an url segment
     * @param {string} s
     * @return {string}
     */
    static decode(s) {

        let d = ''
        s = string(s)
        while (d !== s) {
            decodeURIComponent(s)
            s = d
        }
        return s
    }

    /**
     *
     * @param {string} defaultRedirect
     * @param {struct} params
     * @return {string}
     */
    static defaultRedirectURL(defaultRedirect = '/', params) {
        const url = new AaURI(location.href)
        let redirect = url.query("redirect")
        console.log(url)
        if (redirect) {
            redirect = new AaURI(redirect, UrlRemoveRedirect).toString()
        }
        url.setParams(UrlRemoveRedirect)
        if (redirect.toString() !== url.toString()) {
            if (params) {
                redirect.setParams(params)
            }
            return redirect.toString()
        }

        return new AaURI(defaultRedirect ? defaultRedirect : '/', params).toString()
    }

    /**
     * Encode an url or an url segment
     * @param  {string}s
     * @return {string}
     */
    static encode(s) {
        return encodeURIComponent(s)
    }

    /**
     * replace parameters in url string
     * @param {string|AaURI} s
     * @param {map|struct}  queries
     * @param {map} [newQueries]
     * @return {[string, map,ok]}
     */
    static lookup(s, queries, newQueries) {
        if (!(queries instanceof map)) {
            queries = new map(queries)
        }
        s = string(s)
        if (!s) {
            return [s, queries, false]
        }
        const ps = s.match(/{[\w:-]+}/ig)
        if (!ps) {
            return [s, queries, true]
        }
        if (!newQueries) {
            //  对data进行了局部删除，一定要拷贝一下，避免一些不必要的麻烦
            newQueries = queries.clone(false)
        }
        for (let i = 0; i < ps.length; i++) {
            let m = ps[i]
            let k = m.replace(/^{([\w-]+)[:}].*$/ig, '$1')
            let v = newQueries.get(k, string)  // 支持array, AaImgSrc, Decimal, time 等所有格式数据
            s = s.replace(new RegExp(m, 'g'), v)
            newQueries.delete(k)

        }
        const ok = !(/\/{[\w:-]+}/.test(s))  // 判定是否还有未替换的url param
        return [s, newQueries, ok]
    }


    /**
     * Replace the current history entry
     * @param {struct|null} state
     * @param {string} [title]
     * @param {string} url
     * @doc https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState
     */
    static historyReplace(state, title, url) {
        window.history.replaceState(state, title, url)
    }

    /**
     * Add an entry to history stack
     * @param state
     * @param title
     * @param url
     */
    static historyAdd(state, title, url) {
        window.history.pushState(state, title, url)
    }

    static historyGo(step) {
        window.history.go(step)
    }

    static historyBack() {
        window.history.back()
    }

    static historyForward() {
        window.history.forward()
    }

    /**
     * Split host to hostname and port
     * @param {string} host
     * @return {[string,string ]}
     */
    // e.g. luexu.com:8080, {hostname}:{port:uint},    {aab}.com:{port:uint}
    static splitHost(host) {
        const matches = [...host.matchAll(/{[\w:]+}/g)]
        if (matches.length === 0) {
            return host.split(':')
        }

        for (let i = 0; i < matches.length; i++) {
            host = host.replace(matches[i][0], "#" + i)  // # is not allowed in host
        }
        let [hostname, port] = host.split(':')
        if (!port) {
            return [hostname, port]
        }

        for (let i = 0; i < matches.length; i++) {
            hostname = hostname.replace('#' + i, matches[i][0])
            port = port.replace('#' + i, matches[i][0])
        }
        return [hostname, port]
    }
}
