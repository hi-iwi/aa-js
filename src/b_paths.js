class paths {
    name = 'aa-path'
    /** @proprerty {string} the directory of the, e.g. /a/b */
    dir
    /** @property {string} the last element of path, e.g.  / ==> /;   /a/b => b */
    base
    /** @property {string} the extension of path, e.g. ".js" */
    ext
    /** @property {string} the file name of path, e.g.  "a/b/c.jpg" => c */
    filename
    /** @property {string} the href.origin, e.g. https://luexu.com */
    origin

    /**
     * @param {string} path
     */
    init(path) {
        if (!path || path === '.') {
            return ''
        }
        let origin = ''
        let match = path.match(/^\w+:\/\/[^\/]+\/?/)
        if (match) {
            origin = match[0].replace(/\/$/, '')
            path = path.substring(origin.length)
        }

        // Replace multiple slashes with a single slash.      e.g. "a//b/c" ===> "a/b/c
        path = path.replace(/\/+/g, '/')
        // Eliminate each . path name element (the current directory).
        // e.g. "/a/../b/./c/././d" ===>  "/a/../b/c/d"
        let reg = /\/\.(\/|$)/g
        while (reg.test(path)) {
            path = path.replace(reg, '/')   // 可以加g：
        }

        // Eliminate each inner .. path name element (the parent directory) along with the non-.. element that precedes it.
        //    e.g. "a/b/c/.." ===> "a/b"
        reg = /[^\/]+\/\.\.(\/|$)/
        while (reg.test(path)) {
            path = path.replace(reg, '')    // 不要加 g： ../../../
        }
        path = path.replace(/^\/..\//g, '/')  // root 的 /../  属于特殊情况，直接返回 /
        // Eliminate .. elements that begin a rooted path: that is, replace "/.." by "/" at the beginning of a path.
        if (path !== '/') {
            path = path.replace(/\/$/, '')
        }

        this.origin = origin
        if (!path || path === '/') {
            this.dir = ''
            this.base = path
            this.ext = ''
            this.filename = ''
            return
        }
        const a = path.split('/')
        this.dir = a.slice(0, a.length - 1).join('/') || '/'
        this.base = a[a.length - 1] || '/'

        let b = this.base.split('.')
        if (b.length === 1) {
            this.ext = ''
            this.filename = this.base
        } else {
            this.ext = b[b.length - 1]
            this.filename = b.slice(0, b.length - 1).join('.')
        }
    }

    /**
     * @param {string} path
     */
    constructor(path) {
        this.init(path)
    }


    // Report whether the path is absolute
    isAbs() {
        return this.dir[0] === '/'
    }

    toSlash(separator = '\\') {
        return this.toString().replace(/\//g, separator)
    }

    toString() {
        return this.origin + paths.join(this.dir, this.base)
    }

    /**
     * Clean a path to get the shortest path name equivalent to path by purely lexical processing.
     * @param {string} path
     * @example
     *  .clean("/../a/c/")  ===>  /a/c
     *  .clean("a/b/c/..")  ===> a/b
     *  .clean("./a/b/c/..")  ===> ./a/b
     *  .clean("/./a/b/c/..")  ===> /a/b
     *  .clean("/../a//b/c/d/e/../../../f/.//./g/.//.///./../.././i/./../.")  ===> /a/b
     *  .clean("../a//b/c/d/e/../../../f/.//./g/.//.///./../.././i/./../.")  ===> ../a/b
     */
    static clean(path) {
        return new paths(path).toString()
    }

    /**
     *
     * @param {StringN} args
     * @example join("a/b","../../../xyz")  ===>  ../xyz
     */
    static join(...args) {
        panic.arrayErrorType(args, ['string', 'number'], OPTIONAL)
        let path = args.join('/')
        return paths.clean(path)
    }
}

