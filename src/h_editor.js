/** @typedef {(src:string)=>(AaAudioSrc|AaFileSrc|AaImgSrc|AaVideoSrc)}  SrcComposer */
class AaEditor {
    name = 'aa-editor'

    /** @type {void|((href:string)=>string)} */
    anchorHrefHandler
    // 这里是上传服务器的最终结果，也就是编辑器编辑完成后，提交前进行的操作，因此不需要支持所有标签
    submittableAttributeWhitelist = {
        default: ['class', 'contenteditable', 'style'],
        IMG    : ['alt', 'data-path', 'width', 'height'],
        TABLE  : [],
        TD     : ['data-row', 'nowrap'],
        LI     : ['data-list'],
        PRE    : ['data-language'],
    }
    temporaryAttributeWhitelist = {
        default: ['title'],
        IMG    : ['src'],
    }

    classWhitelist = [/^e-/]
    styleWhitelist = ['background', 'background-color', 'color', 'zoom']
    textAlignWhitelist = ['center', 'right']  // justify 为默认；
    inlineElements = ['B', 'DEL', 'EM', 'I', 'PRIVACY', 'S', 'SPAN', 'STRONG', 'SUB', 'SUP', 'U']
    emptyableElements = ['DD', 'DT', 'P', 'TD']
    srcElements = ['AUDIO', 'IMG', 'VIDEO']

    encodeTemplate = {
        // 不替换空格，否则看起来不方便
        ">": "&#62;", '&gt;': '&#62;', "<": "&#60;", '&lt;': '&#60;', "'": "&#39;",   // 不要替换引号；否则会导致html标签难以读
        '"': "&#34;", '&quot;': '&#34;',
        // '&'     : '&#38;',   // 不要替换 &，& 本身是转义，如果替换会导致反复转义。
        // '&amp;' : '&#38;',
    }
    decodeTemplate = {
        "&#62;" : '>',
        '&gt;'  : '>',
        "&#60;" : '<',
        '&lt;'  : '<',
        "&#39;" : "'",
        "&#34;" : '"',
        '&quot;': '"',
        '&#38;' : '&',
        '&amp;' : '&',
    }
    fuzzyTag = '<i class="fuzzy"></i>'

    /** @type {{[key:string]:SrcComposer}} */
    defaultSrcComposers

    constructor() {
    }

    /**
     *
     * @param {string|DOM} content
     * @param {DOM|string} [appendTo]
     * @param {?{[key:string]:SrcComposer}} [srcComposers]
     * @param {(node:DOM)=>?DOM} [hook]
     * @return {?HTMLElement}
     */
    decodeContent(content, appendTo, srcComposers, hook) {
        // 剪贴板从word复制，会组成 <html><body>
        content = AaDOM.parse(content, 'text/html')
        if (!content) {
            return null
        }
        AaDOM.forAll(content, node => {
            if (hook) {
                node = hook(node)
                if (!node) {
                    return
                }
            }
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return
            }
            switch (node.tagName) {
                case 'A':
                    node.setAttribute('target', '_blank')  // for user
                    break
                case 'IMG':
                    this.decodeImgPath(node, this.getSrcComposer(node.tagName, srcComposers))
                    break
            }

            if (node.hasAttribute('data-privacy-key')) {
                node.innerHTML = this.fuzzy(node.innerHTML)
            }
        })
        return AaDOM.appendChildNodes(content, appendTo)
    }

    /**
     * @param {HTMLElement} node
     * @param {SrcComposer} [composer]
     */
    decodeImgPath(node, composer) {
        const src = node.getAttribute('src')
        const path = node.dataset.path

        if ((!src && !path) || typeof composer !== "function") {
            return
        }

        /** @type {AaImgSrc} */
        const imgsrc = composer(path ? path : src)
        if (!imgsrc) {
            return
        }
        node.dataset.path = imgsrc.path

        const fa = imgsrc.fit(MAX)
        loge(fa)
        node.setAttribute("src", fa.url)
        node.setAttribute("width", String(fa.width))
        node.setAttribute("height", String(fa.height))
        node.dataset.width = String(fa.originalWidth)
        node.dataset.height = String(fa.originalHeight)
    }


    /**
     * @param {DOM|string} selector    id: #ID, class: .className
     * @param  {{[key:string]:SrcComposer}} [srcComposers]
     */
    decodeSelector(selector, srcComposers) {
        return this.decodeContent(AaDOM.querySelector(selector), selector, srcComposers)
    }

    /**
     * Clean HTML content before submit
     * @param {HTMLElement|string} content
     * @param {?{[key:string]:SrcComposer}} [srcComposers]
     * @return {string}
     */
    encodeContent(content, srcComposers) {
        // 剪贴板从word复制，会组成 <html><body>
        content = AaDOM.parse(content, 'text/html')
        if (!content) {
            return ''
        }
        content = this.formatContent(content, srcComposers, true)
        return content ? content.innerHTML.trim("<p></p>") : ''
    }

    /**
     * Clean pasted HTML content before insert into editor content
     * @param {HTMLElement|string} content
     * @param {{[key:string]:SrcComposer}} [srcComposers]
     * @param {boolean} [beforeSubmit]
     * @param {(node:DOM)=>?DOM} [hook]
     * @return {HTMLElement}
     */
    formatContent(content, srcComposers, beforeSubmit, hook) {
        content = AaDOM.parse(content, 'text/html')
        if (!content) {
            return null
        }
        AaDOM.forAll(content, node => {
            if (node && hook) {
                node = hook(node)
            }
            // maybe removed by child TEXT_NODE nodeValue=''
            if (!node) {
                return
            }
            let parent = node.parentNode
            switch (node.nodeType) {
                case Node.COMMENT_NODE:
                    parent.removeChild(node)
                    break
                case Node.ELEMENT_NODE:
                    this.#cleanHtmlElement(node, srcComposers, beforeSubmit)
                    break
                case Node.TEXT_NODE:
                    // all descendant text nodes must come here
                    let v = node.nodeValue
                    if (!v) {
                        if (!arrays.contains(this.emptyableElements, parent.tagName) && parent.parentNode && parent.innerHTML === '') {
                            parent.parentNode.removeChild(parent)
                        }
                    } else {
                        v = this.#encodeTextNode(v)
                        if (v !== node.nodeValue) {
                            node.nodeValue = v
                        }
                    }
                    break
            }
        })
        return content
    }


    /**
     * Convert fuzzy strings
     * @param {string} s
     * @param {string} [tag]
     * @return {string}
     */
    fuzzy(s, tag) {
        if (!s) {
            return s
        }
        if (!tag) {
            tag = this.fuzzyTag
        }
        s = s.replaceAll(s, [
            ["\r\n", "<br>"],
            ["\r", "<br>"],
            ["\n", "<br>"],
        ])
        s = s.replace(/<fuzzy>\s*\d+\s*:\s*(\d+)\s*<\/fuzzy>/ig, (m, l) => tag.repeat(l))
        return s
    }

    /**
     * @param {string} tagName
     * @param {{[key:string]:SrcComposer}} [composers]
     * @return {?SrcComposer}
     */
    getSrcComposer(tagName, composers) {
        if (composers && composers[tagName]) {
            return composers[tagName]
        }
        if (this.defaultSrcComposers && this.defaultSrcComposers[tagName]) {
            return this.defaultSrcComposers[tagName]
        }
        return null
    }

    /**
     *
     * @param {string} tagName
     * @param {Attr|{name:string, value:string}} attr
     * @param {boolean} [beforeSubmit]
     * @return {boolean}
     */
    isWhiteAttribute(tagName, attr, beforeSubmit) {
        // e.g. rgb()
        if (/(initial|[()])/i.test(attr.value)) {
            return false
        }
        const w = this.submittableAttributeWhitelist
        if (w.default && w.default.includes(attr.name)) {
            return true
        }
        if (w[tagName] && w[tagName].includes(attr.name)) {
            return true
        }

        if (beforeSubmit) {
            return false
        }
        const tmp = this.temporaryAttributeWhitelist

        if (tmp.default && tmp.default.includes(attr.name)) {
            return true
        }
        if (tmp[tagName] && tmp[tagName].includes(attr.name)) {
            return true
        }
        return false
    }

    /**
     * Decode text to HTML
     * @param s
     * @return {string}
     */
    textToHtml(s) {
        if (!s) {
            return ""
        }

        s = string(s)
        for (const [k, v] of Object.entries(this.decodeTemplate)) {
            if (s.indexOf(k) > -1) {
                s = s.replaceAll(k, v)
            }
        }
        s = s.replace(/&#(\d{1,3});/gi, function (match, numStr) {
            let num = parseInt(numStr, 10); // read num as normal number
            return String.fromCharCode(num);
        });
        //  Windows: "\r\n";  Unix: \n;  Mac: \r
        s = s.replaceAll([
            ["\r\n", "<br>"],
            ["\r", "<br>"],
            ["\n", "<br>"],
        ])
        return s
    }

    #cleanAnchor(node) {
        if (this.anchorHrefHandler) {
            let href = this.anchorHrefHandler(node.href)
            if (!href) {
                node.parentNode.removeChild(node)
                return null
            }
            if (href !== node.href) {
                node.href = href
            }
        }
        node.rel = 'nofollow'   // for SEO
        return node
    }

    #cleanAttrs(node, beforeSubmit) {
        this.#cleanAttrStyle(node)
        let remove = []  // node.attributes 是动态的，因此不能直接遍历删除
        const tagName = node.tagName
        for (const attr of node.attributes) {
            if (!this.isWhiteAttribute(tagName, attr, beforeSubmit)) {
                remove.push(attr.name)
            }
        }
        if (remove.length > 0) {
            remove.map(attr => {
                node.removeAttribute(attr)
            })
            log.debug(`remove ${tagName} attribute: ${remove.join(' ,')}`)
        }
    }

    #cleanClassList(node) {
        if (node.classList.length > 0) {
            node.classList.remove("e-align-left", "e-align-justify")
            node.classList.forEach(c => {
                if (!arrays.contains(this.classWhitelist, c)) {
                    node.classList.remove(c)
                    log.debug(`remove ${node.tagName} class ${c}`)
                }
            })
        }
        if (node.classList.length === 0) {
            node.removeAttribute('class')
        }
    }

    #cleanAttrStyle(node) {
        const styles = AaDOM.parseStyleAttr(node)   // must from attribute, not node.style

        let align = styles && styles['text-align'] ? styles['text-align'] : node.getAttribute('align')
        node.classList.remove("e-align-left", "e-align-justify", "e-align-center", "e-align-right")
        node.removeAttribute('align')
        if (align && this.textAlignWhitelist.includes(align)) {
            node.classList.add('e-align-' + align)
        }

        if (!styles) {
            node.removeAttribute('style')
            return
        }

        let remove = []
        for (const [name,] of Object.entries(styles)) {
            if (!arrays.contains(this.styleWhitelist, name)) {
                remove.push(name)
                delete styles[name]  // 删除安全
            }
        }
        if (remove.length > 0) {
            log.debug(`remove ${node.tagName} style: ${remove.join(' ,')}`)
            if (len(styles) === 0) {
                node.removeAttribute('style')
            } else {
                node.setAttribute('style', map.join(styles, ':', ';'))
            }
        }
    }

    #cleanHtmlElement(node, srcComposers, beforeSubmit) {
        if (this.srcElements.includes(node.tagName)) {
            let composer = this.getSrcComposer(node.tagName, srcComposers)
            node = this.#cleanSrcElement(node, composer)
        } else if (node.tagName === 'A') {
            node = this.#cleanAnchor(node)
        }

        if (!node) {
            return node
        }

        if (/^H\d$/.test(node.tagName)) {
            for (const attr of node.attributes) {
                node.removeAttribute(attr.name)
            }
        } else {
            this.#cleanAttrs(node, beforeSubmit)
            this.#cleanClassList(node)
            return this.#cleanHtmlTag(node)
        }
    }

    /**
     * @param {HTMLElement} node
     */
    #cleanHtmlTag(node) {
        if (/[^A-Z\d]/.test(node.tagName)) {
            if (node.innerHTML === '') {
                node.parentNode.removeChild(node)
                return null
            }
            let newNode = document.createElement('span')
            newNode.innerHTML = node.innerHTML
            node.parentNode.insertBefore(newNode, node)
        }

        if (node.childNodes.length === 1) {
            let first = node.childNodes.item(0)
            // 本函数需要倒序遍历子节点，因此不需要处理子节点了，只需要处理是否为 span即可
            if (first.nodeType === Node.ELEMENT_NODE && first.tagName === 'SPAN') {
                node.innerHTML = first.innerHTML
            }
        }
        return node
    }

    #cleanSrcElement(node, composer) {
        let path = node.dataset.path
        let src = node.src
        if (composer && src) {
            let srcObj = composer(src)
            if (srcObj) {
                if (path && path !== srcObj.path) {
                    log.warn(`data-path overwrite: ${path} ---> ${srcObj.path} `)
                }
                path = srcObj.path
                node.dataset.path = path
                node.setAttribute('src', srcObj.fit(MAX).url)
            }
        }
        if (!path) {
            node.parentNode.removeChild(node)
            log.warn(`remove ${node.tagName} src=${src}`)
            return null
        }
        return node
    }


    #encodeTextNode(s) {
        for (const [k, v] of Object.entries(this.encodeTemplate)) {
            if (s.indexOf(k) > -1) {
                s = s.replaceAll(k, v)
            }
        }
        return s
    }


}