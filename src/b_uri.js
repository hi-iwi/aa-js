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
                domain             path                query        fragment
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

    baseUrl  // ? 之前的部分
    scheme  //  e.g. http/tcp  or empty
    protocol
    hierarchicalPart
    authority
    path
    queries
    fragment


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

    constructor(url = window.location.href, params = {}) {
        this.parse(url)
        if (len(params) > 0) {
            this.extend(params)
        }
    }


    /*
     ① //luexu.com
     ② //luexu.com/hi
     ③ https://luexu.com
     ④ http://192.168.0.1
     ⑤ //localhost   --> https://localhost
     ⑥ /home/me  --> https://xxx.xx/home/me
     @TODO 支持相对路径
     */
    parse(url = location.href) {

        // 绝对路径URL
        if (url.substring(0, 1) === '/') {
            if (url.substring(1, 2) === '/') {
                url = window.location.protocol + url
            } else {
                url = window.location.origin + url
            }
        }

        let b = url.split('?');
        let baseUrl = b[0];
        let qs = b.length > 1 ? b[1] : ''
        let fragment = ''
        if (qs.indexOf('#') > 0) {
            b = qs.split('#')
            qs = b[0]
            fragment = b[1]
        }


        b = baseUrl.split('//');
        let protocol = b[0]  // https:
        let scheme = protocol.replace(':', '')    // https

        let hierarchicalPart = b.length > 1 ? b[1] : ''
        b = hierarchicalPart.indexOf('/')

        let authority = hierarchicalPart.substring(0, b)
        let path = hierarchicalPart.substring(b)

        let queries = new map();
        if (qs.length > 1) {
            let q = qs.split('&');
            for (let i = 0; i < q.length; i++) {
                if (q[i] === '') {
                    continue;
                }
                let p = q[i].split('=');
                queries.set(p[0], p.length > 1 ? _aaURI.decode(p[1]) : '')
            }
        }
        this.baseUrl = baseUrl   // ? 之前的部分
        this.scheme = scheme  //  e.g. http/tcp  or empty
        this.protocol = protocol
        this.hierarchicalPart = hierarchicalPart
        this.authority = authority
        this.path = path
        //this.queryString = queryString
        this.queries = queries
        this.fragment = fragment
        return this
    }


    valid() {
        // 判定是否还有未替换的url param
        return /\/{[\w:-]+}/.test(this.baseUrl)
    }

    /*

*/

    /**
     *
     * 根据 iris 路由规则来
     * /api/v1/{name:uint64}/hello
     * /api/v1/{name}
     */
    lookup() {
        let url = this.baseUrl
        let queries = this.queries
        const ps = url.match(/{[\w:-]+}/ig)
        if (ps === null) {
            return [url, queries]
        }
//  对data进行了局部删除，一定要深度拷贝一下，避免一些不必要的麻烦
        let q = queries.clone()
        for (let i = 0; i < ps.length; i++) {
            let m = ps[i]
            let k = m.replace(/^{([\w-]+)[:}].*$/ig, '$1')
            let v = q.get(k)
            if (v !== "") {
                url = url.replace(new RegExp(m, 'g'), v)
                q.delete(k)
            }
        }
        return [url, q]
    }

    toString() {
        let [s, q] = this.lookup()
        const qs = q.toQueryString()
        if (qs) {
            s += '?' + qs
        }
        if (this.fragment) {
            s += '#' + this.fragment
        }
        return s
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
