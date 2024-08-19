/**
 * @typedef {Node|HTMLElement|Document} DOM    anything extends Node
 *
 * Node 继承关系特别复杂，不同子element具有方法差别较大，因此不再统一封装
 *    Document : Node : EventTarget
 *    HtmlElement : Node : EventTarget
 */
class AaDOM {

    static appendChildNodes(appendFrom, appendTo) {
        appendTo = AaDOM.querySelector(appendTo)
        if (!appendTo || appendTo === appendFrom) {
            return appendFrom
        }

        let children = []
        // forEach 是不安全的，中间进行操作就会改变；需要转存
        appendFrom.childNodes.forEach(node => {
            children.push(node)
        })

        children.map(node => {
            appendTo.appendChild(node)
        })
        return appendTo
    }

    /**
     * List all descendants by generation
     * @param dom
     * @param doms
     * @param generation
     * @return {Node[][]}
     * @example AaDOM.forAll()
     */
    static generations(dom, doms = [], generation = 0) {

        if (!dom || dom.childNodes.length === 0) {
            return doms
        }
        let childNodes = [...dom.childNodes]
        if (doms.length < generation + 1) {
            doms.push(childNodes)
        } else {
            doms[generation] = doms[generation].concat(childNodes)
        }
        const nextGeneration = generation + 1
        dom.childNodes.forEach(child => {
            doms = AaDOM.generations(child, doms, nextGeneration)
        })
        return doms
    }

    /**
     * Iterate all descendant nodes
     * @param {DOM} dom
     * @param {(node:DOM)=>void } callback
     * @example
     *    const dom = new DOMParser().parseFromString('<div>Aario</div>', 'text/html').querySelector('body')
     *    AaDOM.forAll(dom, node=>console.log(node, node.nodeType)
     *    ---> output :
     *          "Aario" 3
     *          <div>Aario</div> 1
     */
    static forAll(dom, callback) {
        if (!dom) {
            return
        }
        let generations = AaDOM.generations(dom)
        for (let i = generations.length - 1; i > -1; i--) {
            let g = generations[i]
            for (let j = 0; j < g.length; j++) {
                callback(g[j])
            }
        }
    }

    /**
     *
     * @param {string|Node} s
     * @param {DOMParserSupportedType} type
     * @return {Node|null}
     */
    static parse(s, type = 'text/html') {
        if (!s) {
            return null
        }
        if (s instanceof Node) {
            return s
        }
        return new DOMParser().parseFromString(s, type).body
    }

    /**
     * @param {Node|string} styleAttr
     * @param {boolean} [useCamelKey]
     * @note node.style contains all styles ,including css styles. node.getAttribute('style') is the value of html style attribute
     * @return {struct}
     */
    static parseStyleAttr(styleAttr, useCamelKey = false) {
        if (styleAttr instanceof Node) {
            styleAttr = styleAttr.getAttribute('style')
        }

        const styleArr = strings.split(styleAttr, ';')
        if (styleArr.length === 0) {
            return null
        }

        let styles = {}
        styleArr.map(pair => {
            let p = strings.split(pair, ':')
            if (p.length !== 2 || p[0] === '' || p[1] === '') {
                return
            }
            let key = useCamelKey ? fmt.toCamelCase(p[0]) : p[0]
            styles[key] = p[1]
        })
        return Object.keys(styles).length === 0 ? null : styles
    }

    /**
     * @param {Node|string} selector
     * @return {DOM|null}
     */
    static querySelector(selector) {
        if (!selector) {
            return null
        }
        // document.querySelector(document) 就会报错，因此先行判断
        if (selector instanceof Node) {
            return selector
        }
        return document.querySelector(selector)
    }
}