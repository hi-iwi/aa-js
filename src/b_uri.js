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

class _aaURI {
    name = 'aa-uri'


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
        const [protocol, _] = _aaURI.lookup(this.#protocol, this.queries)
        return protocol.toLowerCase()
    }

    get hostname() {
        const [hostname, _] = _aaURI.lookup(this.#hostname, this.queries)
        return hostname
    }

    get port() {
        const [port, _] = _aaURI.lookup(this.#port, this.queries)
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
        const [pathname, _] = _aaURI.lookup(this.#pathname, this.queries)
        return pathname
    }

    get hash() {
        const [hash, _] = _aaURI.lookup(this.#hash, this.queries)
        return hash
    }


    get search() {
        const [base, queries, hash, ok] = this.parse()
        const qs = queries.toQueryString()
        return qs ? '?' + qs : ''
    }


    /**
     * replace parameters in url string
     * @param {string|*} s
     * @param {map|{[key:string]:*}}  queries
     * @param {map} [newQueries]
     * @return {[string, map]}
     */
    static lookup(s, queries, newQueries) {
        if (!(queries instanceof map)) {
            queries = new map(queries)
        }
        s = string(s)
        if (!s) {
            return [s, queries]
        }
        const ps = s.match(/{[\w:-]+}/ig)
        if (!ps) {
            return [s, queries]
        }
        if (!newQueries) {
            //  对data进行了局部删除，一定要深度拷贝一下，避免一些不必要的麻烦
            newQueries = queries.clone(false)
        }
        for (let i = 0; i < ps.length; i++) {
            let m = ps[i]
            let k = m.replace(/^{([\w-]+)[:}].*$/ig, '$1')
            let v = newQueries.get(k)
            if (v !== "") {
                s = s.replace(new RegExp(m, 'g'), v)
                newQueries.delete(k)
            }
        }
        return [s, newQueries]
    }


    parse() {
        let newQueries = this.queries.clone(false)
        let port = this.#port ? ':' + this.#port : ''
        let s = this.#protocol + '//' + this.#hostname + port + this.#pathname
        let baseUrl, hash;
        [baseUrl, newQueries] = _aaURI.lookup(s, this.queries, newQueries)
        if (this.#hash) {
            [hash, newQueries] = _aaURI.lookup(this.#hash, this.queries, newQueries)
        }
        if (baseUrl.indexOf('http:') === 0 && baseUrl.indexOf(':80/')) {
            baseUrl = baseUrl.replace(':80/', '/')
        }
        if (baseUrl.indexOf('https:') === 0 && baseUrl.indexOf(':443/')) {
            baseUrl = baseUrl.replace(':443/', '/')
        }
        const ok = /\/{[\w:-]+}/.test(baseUrl)  // 判定是否还有未替换的url param
        return [baseUrl, newQueries, hash, ok]
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
     *
     * @param url
     */
    static split(url) {

    }

    /**
     * @param {string} url
     * @param {map|{[key:string]:*}} [params]
     * @param {string} [hash]
     */
    constructor(url = window.location.href, params, hash) {
        this.init(url, params, hash)
    }


    /*
        {protocol:string}//{hostname}:{port:uint}/{path1:string}/{path2:int}#{hash}
     ① //luexu.com
     ② //luexu.com/hi
     ③ https://luexu.com
     ④ http://192.168.0.1:8080
     ⑤ //localhost   --> https://localhost
     ⑥ /home/me  --> https://xxx.xx/home/me
     */
    /**
     * @param {string} url
     * @param {{[key:string]:*}} [params]
     * @param {string} [hash]
     */
    init(url = location.href, params, hash = '') {
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
                queries.set(p[0], p.length > 1 ? _aaURI.decode(p[1]) : '')
            }
        }

        // must greater than 0,  a://xxxx
        if (baseUrl.indexOf('://') <= 0) {
            return
        }
        b = baseUrl.split('://')
        let protocol = b[0]    //  e.g. {scheme:string}, https:, tcp:,  or empty
        let hierPart = b[1]
        const x = hierPart.indexOf('/')
        const host = hierPart.substring(0, x)
        const pathname = hierPart.substring(x)
        const [hostname, port] = _aaURI.splitHost(host)

        this.#protocol = protocol  //  e.g. {scheme:string}: http/tcp  or empty
        this.hostname = hostname
        this.port = port
        this.#pathname = pathname
        this.queries = queries

        this.hash = string(hash)

        // 一定要在 queries 实例化后
        if (len(params) > 0) {
            this.extend(params)
        }

    }


    toString() {
        let [base, queries, hash, ok] = this.parse()
        const qs = queries.toQueryString()
        if (qs) {
            base += '?' + qs
        }
        if (hash) {
            base += '#' + this.hash
        }
        return base
    }

    toJSON() {
        return this.toString()
    }

    sort() {
        this.queries.sort()
        return this
    }

    filter(filter) {
        this.queries.forEach((k, v) => {
            if (filter(k, v)) {
                // 这种方式forEach 中进行删除未遍历到的值是安全的
                this.queries.delete(k)
            }
        })
        return this
    }


    filterEmpty(empty = ['', '0', 0]) {
        return this.filter((k, v) => empty.includes(v))
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
     * @return {_aaURI}
     */
    extend(params) {
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


}
