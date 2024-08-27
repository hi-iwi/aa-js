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
        path = string(path)
        let origin = ''

        let arr = path.split("://")
        if (arr.length > 1 && /^\w+$/.test(arr[0])) {
            origin = arr[0] + "://"
            path = arr.slice(1).join('')
            arr = path.split('/')
            origin += arr[0]
            arr = arr.slice(1)
            path = arr.length > 0 ? '/' + arr.join('/') : ''

        } else {
            arr = path.split('/')
        }


        let isDir = path.slice(-1) === '/'
        let dir = ''
        let base = ''
        if (arr.length > 0) {
            let ignore = 0
            for (let i = arr.length - 1; i > -1; i--) {
                let s = arr[i]
                if (!s || s === '.') {
                    continue
                }
                if (s === "..") {
                    ignore++
                    continue
                }
                if (ignore > 0) {
                    ignore--
                    continue
                }

                if (!isDir && base === '') {
                    base = s
                } else {
                    dir = s + '/' + dir
                }
            }

            dir = dir.trimEnd('/')
            if (path.substring(0, 1) === '/') {
                dir = '/' + dir
            } else if (ignore > 0) {
                dir = '../'.repeat(ignore) + dir
            }

        }
        const ext = paths.ext(base)
        const filename = base.trimEnd(ext, 1)
        this.base = base
        this.dir = dir
        this.ext = ext
        this.filename = filename
        this.origin = origin
    }

    /**
     * @param {string} path
     */
    constructor(path) {
        this.init(path)
    }

    static new(path) {
        return new paths(path)
    }

    // Report whether the path is absolute
    isAbs() {
        return this.dir[0] === '/'
    }

    replaceAll(searchValue, replaceValue) {
        return this.toString().replaceAll(searchValue, replaceValue)
    }

    toSlash(separator = '\\') {
        return this.replaceAll('/', separator)
    }

    toString() {
        let path = this.dir ? this.dir + '/' + this.base : this.base
        return this.origin + path
    }

    /**
     * Clean a path to get the shortest path name equivalent to path by purely lexical processing.
     * @param {string} path
     * @example
     *  .clean("/../a/c/")  ===>  /a/c
     *  .clean("a/b/c/..")  ===> a/b
     *  .clean("./a/b/c/..")  ===> a/b
     *  .clean("/./a/b/c/..")  ===> /a/b
     *  .clean("/../a//b/c/d/e/../../../f/.//./g/.//.///./../.././i/./../.")  ===> /a/b
     *  .clean("../a//b/c/d/e/../../../f/.//./g/.//.///./../.././i/./../.")  ===> ../a/b
     */
    static clean(path) {
        return new paths(path).toString()
    }

    /**
     * Return the last element of path, base equals to filename + ext
     * @param path
     * @return {*|string}
     */
    static base(path) {
        if (!path || path[path.length - 1] === '/') {
            return ""
        }
        let i = path.lastIndexOf('/')
        return i < 0 ? path : path.slice(i)
    }

    static ext(path) {
        for (let i = len(path) - 1; i >= 0 && path[i] !== '/'; i--) {
            if (path[i] === '.') {
                return path.slice(i)
            }
        }
        return ""
    }

    /**
     * Join paths with slash
     * @param {str} base
     * @param {string} args
     * @example
     *  join("a/b","../../../xyz")  ===>  ../xyz
     *  join("https://luexu.com", "/") ===> https://luexu.com
     *  join("", "//test/file")  ===> test/file
     *  join("/", "//test/file") ===> /test/file
     */
    static join(base, ...args) {
        base = !base || base === '/' ? base : base.trimEnd('/')
        args.map(arg => {
            const arr = arg.split('/')
            arr.map(a => {
                if (!a) {
                    return CONTINUE
                }
                if (base && base !== '/') {
                    base += '/'
                }
                base += a
            })
        })
        return base
    }


}

