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

    method

    // @type boolean
    #isTemplate = false   // is using template
    // @type string e.g. {scheme:string}, https:, tcp:
    #protocol
    // @type string
    #hostname
    // @type string
    #port
    // @type string
    #pathname
    // @type {map}
    queries

    // @type string
    #hash  // alias to location.hash


    get protocol() {
        const [protocol, ,] = AaURI.lookup(this.#protocol, this.queries)
        return protocol.toLowerCase()
    }

    get hostname() {
        const [hostname, ,] = AaURI.lookup(this.#hostname, this.queries)
        return hostname
    }

    get port() {
        const [port, ,] = AaURI.lookup(this.#port, this.queries)
        return port
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

    // e.g. http://luexu.com
    get origin() {
        return this.protocol + "//" + this.host
    }

    get pathname() {
        const [pathname, ,] = AaURI.lookup(this.#pathname, this.queries)
        return pathname
    }

    get hash() {
        const [hash, ,] = AaURI.lookup(this.#hash, this.queries)
        return hash
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
    init(url = location.href, params, hash = '') {
        url = string(url).trim()  // will convert url:_aaURI to url.String()
        let method = void ''
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

        let b = url.split('?')
        let baseUrl = b[0]
        let queryStr = b.length > 1 ? b[1] : ''
        // fragment
        if (typeof hash === "undefined") {
            if (queryStr.indexOf('#') > 0) {
                b = queryStr.split('#')
                queryStr = b[0]
                hash = b[1]
            }
        }
        // query string
        let queries = new map();
        if (queryStr.length > 1) {
            let q = queryStr.split('&');
            for (let i = 0; i < q.length; i++) {
                if (q[i] === '') {
                    continue;
                }
                let p = q[i].split('=');
                queries.set(p[0], p.length > 1 ? AaURI.decode(p[1]) : '')
            }
        }

        // must greater than 0,  a://xxxx
        if (baseUrl.indexOf('://') > 0) {
            b = baseUrl.split('://')
            let protocol = b[0]    //  e.g. {scheme:string}, https:, tcp:,  or empty
            let hierPart = b[1]
            const x = hierPart.indexOf('/')
            const host = hierPart.substring(0, x)
            const pathname = hierPart.substring(x)
            const [hostname, port] = AaURI.splitHost(host)
            this.#protocol = protocol  //  e.g. {scheme:string}: http/tcp  or empty
            this.#hostname = hostname
            this.#port = port
            this.#pathname = pathname
        }

        this.method = method
        this.queries = queries

        this.#hash = string(hash)
        // 一定要在 queries 实例化后
        if (len(params) > 0) {
            this.setParams(params)
        }
    }

    /**
     * @param {string} url
     * @param {map|{[key:string]:*}} [params]
     * @param {string} [hash]
     */
    constructor(url = window.location.href, params, hash) {
        this.init(url, params, hash)
    }


    sort() {
        this.queries.sort()
        return this
    }

    filter(filter) {
        this.queries.forEach((key, value) => {
            if (filter(key, value)) {
                // 这种方式forEach 中进行删除未遍历到的值是安全的
                this.queries.delete(key)
            }
        })
        return this
    }


    filterEmpty(empty = ['', '0', 0]) {
        return this.filter((_, value) => empty.includes(value))
    }


    has(key) {
        return this.queries.has(key)
    }

    delete(key) {
        this.queries.delete(key)
        return this
    }

    /**
     *
     * @param {map|{[key:string]:*}} params
     * @return {AaURI}
     */
    setParams(params) {
        this.queries.extend(params)
        return this
    }

    set(key, value) {
        this.queries.set(key, value)
        return this
    }


    queryString(assert) {
        if (typeof assert === "string") {
            return this.query(assert, string)
        }
        return this.queries.toQueryString(assert)
    }


    query(key, cast = string) {
        return this.queries.get(key, cast)
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

    /**
     * Parse lookup
     * @return {{baseUrl: string, search: string, ok: ok, queries: map, url: string, hash: string}}
     */
    parse() {
        if (!this.#protocol || !this.#hostname || !this.#port || !this.#pathname || !this.queries) {
            return {
                ok     : false,
                url    : '',
                baseUrl: '',
                queries: this.queries,
                search : '',
                hash   : '',
            }
        }
        let newQueries = this.queries.clone(false)

        let port = this.#port ? ':' + this.#port : ''
        let s = this.#protocol + '://' + this.#hostname + port + this.#pathname
        let baseUrl, hash, ok, ok2;
        [baseUrl, newQueries, ok] = AaURI.lookup(s, this.queries, newQueries)
        if (this.#hash) {
            [hash, newQueries, ok2] = AaURI.lookup(this.#hash, this.queries, newQueries)
            if (!ok2) {
                hash = ''
            }
        }

        if (baseUrl.indexOf('http:') === 0 && baseUrl.indexOf(':80/')) {
            baseUrl = baseUrl.replace(':80/', '/')
        }
        if (baseUrl.indexOf('https:') === 0 && baseUrl.indexOf(':443/')) {
            baseUrl = baseUrl.replace(':443/', '/')
        }
        let search = newQueries.toQueryString()


        if (search) {
            search = '?' + search
        }
        let url = baseUrl + search
        if (hash) {
            url += '#' + hash
        }
        return {
            ok     : ok,
            url    : url,
            baseUrl: baseUrl,
            queries: newQueries,
            search : search,
            hash   : hash,
        }
    }


    toString() {
        const p = this.parse()
        return p.url
    }

    toJSON() {
        return this.toString()
    }


    // 预留
    static encode(s) {
        return encodeURIComponent(s)
    }

    // 多次转码后，解析到底
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


    /**
     * replace parameters in url string
     * @param {string|*} s
     * @param {map|{[key:string]:*}}  queries
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
     *
     * @param {string} defaultRedirect
     * @param {struct} params
     * @return {string}
     */
    static defaultRedirectURL(defaultRedirect = '/', params) {
        const url = new AaURI(location.href)
        let redirect = url.query("redirect")
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
}
