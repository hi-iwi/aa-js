const _aaHtmlTplLeftClose_ = '(_._._._|I|W|I|____[[['
const _aaHtmlTplRightClose_ = ']]]____|I|W|I|_._._._)'
const _aaHtmlEncoder_ = {
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
const _aaHtmlDecoder_ = {
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


class html {
    name = 'aa-html'

    // 对文章中敏感词进行马赛克化
    static fuzzy(s) {
        s = s.replace(/[\r\n]+/g, '<br>')
        s = s.replace(/<s>\s*\d+\s*:\s*(\d+)\s*<\/s>/ig, (m, l) => '<i class="f8 f94b"></i>'.repeat(l))
        return s
    }

    /**
     * HTML encode
     * @param s
     * @return {string|string|*|string}
     */
    static encode(s) {
        if (!s) {
            return ""
        }
        s = string(s)
        let i = 0
        let tags = {} // html 标签内

        for (let a of s.match(/<\/?[a-zA-Z][a-zA-Z\d]*[^>]*>/ig)) {
            if (typeof tags[a] !== "undefined") {
                continue
            }
            let b = _aaHtmlTplLeftClose_ + i + _aaHtmlTplRightClose_
            i++
            tags[a] = b
            s = s.replace(new RegExp(a, 'g'), b)
        }

        for (const [k, v] of Object.entries(_aaHtmlEncoder_)) {
            if (s.indexOf(k) > -1) {
                s = s.replace(new RegExp(k, 'g'), v)
            }
        }
        for (let [a, b] of Object.entries(tags)) {
            s = s.replace(new RegExp(b, 'g'), a)
        }
        return s
    }

    /**
     * HTML decode
     * @param s
     * @return {string}
     */
    static decode(s) {
        if (!s) {
            return ""
        }
        s = string(s)
        while (s.indexOf("&amp;") > -1) {
            s = s.replace("&amp;", "&")
        }
        for (const [k, v] of Object.entries(_aaHtmlDecoder_)) {
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

    // 无标签的text，替换 换行符、空格
    static encodeText(s) {
        if (!s) {
            return ""
        }
        s = string(s)
        for (const [k, v] of Object.entries(_aaHtmlEncoder_)) {
            if (s.indexOf(k) > -1) {
                s = s.replace(new RegExp(k, 'g'), v)
            }
        }
        s = s.replace(/\r\n/g, '<br>')  // &#10;  --> \n
        s = s.replace(/\r/g, '<br>')  // &#10;  --> \n
        s = s.replace(/\n/g, '<br>')  // &#10;  --> \n
        return s
    }

    static decodeText(s) {
        s = string(s).replace(new RegExp('<br>', 'g'), '\r\n')
        s = html.decode(s)
        return s
    }


}