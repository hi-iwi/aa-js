/**
 * @import atype
 */

class htmls {
    name = 'aa-html'

    static encodeTemplate = {
        // 不替换空格，否则看起来不方便
        ">"     : "&#62;",
        '&gt;'  : '&#62;',
        "<"     : "&#60;",
        '&lt;'  : '&#60;',
        "'"     : "&#39;",   // 不要替换引号；否则会导致html标签难以读
        '"'     : "&#34;",
        '&quot;': '&#34;',
        // '&'     : '&#38;',   // 不要替换 &，& 本身是转义，如果替换会导致反复转义。
        // '&amp;' : '&#38;',
    }
    static decodeTemplate = {
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

    static fuzzyTag = '<i class="fuzzy"></i>'


    static #encodeTextNode(s) {
        for (const [k, v] of Object.entries(htmls.encodeTemplate)) {
            if (s.indexOf(k) > -1) {
                s = s.replace(new RegExp(k, 'g'), v)
            }
        }
        return s
    }

    static #encodeVirtualDom(dom) {
        if (!dom) {
            return
        }
        dom.childNodes.forEach(node => {
            // text nodes' type is 3, test nodes are not inside an element
            // e.g.  `Hello, I'm <b>Aario</b>! What is <i>your name</i>?` => text, b, text, i, text
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue !== '') {
                const v = htmls.#encodeTextNode(node.nodeValue)
                if (v !== node.nodeValue) {
                    node.nodeValue = v
                }
                return
            }

            htmls.#encodeVirtualDom(node)
        })
    }

    /**
     * HTML decode
     * @param {StringN} s
     * @return {string}
     */
    static decode(s) {
        if (!s) {
            return ""
        }

        s = string(s).replace(/&amp;/ig, '&')
        for (const [k, v] of Object.entries(htmls.decodeTemplate)) {
            if (s.indexOf(k) > -1) {
                s = s.replace(new RegExp(k, 'g'), v)
            }
        }
        s = s.replace(/&#(\d{1,3});/gi, function (match, numStr) {
            let num = parseInt(numStr, 10); // read num as normal number
            return String.fromCharCode(num);
        });
        return s
    }

    static decodeText(s) {
        s = string(s).replace(new RegExp('<br>', 'g'), '\r\n')
        s = htmls.decode(s)
        return s
    }


    /**
     * HTML encode
     * @param {StringN} s
     * @return {string|string|*|string}
     */
    static encode(s) {
        if (!s) {
            return ""
        }
        const parser = new DOMParser()
        const doc = parser.parseFromString(s, 'text/html')
        const elements = doc.querySelector('body')
        htmls.#encodeVirtualDom(elements)
        return elements.innerHTML.replace(/&amp;/ig, '&')
    }

    // 无标签的text，替换 换行符、空格
    static encodeText(s) {
        if (!s) {
            return ""
        }

        s = string(s)
        for (const [k, v] of Object.entries(htmls.encodeTemplate)) {
            if (s.indexOf(k) > -1) {
                s = s.replace(new RegExp(k, 'g'), v)
            }
        }
        s = s.replace(/\r\n/g, '<br>')  // Win: \r\n
        s = s.replace(/[\r\n]/g, '<br>')  // Unix: \n;  Mac: \r
        return s
    }

    // 对文章中敏感词进行马赛克化
    static fuzzy(s, tag = htmls.fuzzyTag) {
        if (!s || !tag) {
            return s
        }
        s = s.replace(/[\r\n]+/g, '<br>')
        s = s.replace(/<s>\s*\d+\s*:\s*(\d+)\s*<\/s>/ig, (m, l) => tag.repeat(l))
        return s
    }


}