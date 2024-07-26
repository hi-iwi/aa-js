/**
 * @typedef {(path:string) => struct} ImgSrcDataMaker
 */
class AaEditor {
    name = 'aa-editor'
    #oss
    //@type {ImgSrcDataMaker|null}
    imgSrcDataMaker
    videoSrcDataMaker
    audioSrcDataMaker
    fileSrcDataMaker

    /**
     * .className,  #ID,  tag
     * @type {[string]}
     */
    whiteList = [".hidden-url"]

    /**
     *
     * @param {AaOSS} oss
     * @param ossDataMakers
     */
    constructor(oss, ...ossDataMakers) {
        this.#oss = oss
        for (let i = 0; i < ossDataMakers.length; i++) {
            let maker = ossDataMakers[i]
            if (maker instanceof AaImgSrc) {
                this.imgSrcDataMaker = maker
            } else if (maker instanceof AaVideoSrc) {
                this.videoSrcDataMaker = maker
            } else if (maker instanceof AaAudioSrc) {
                this.audioSrcDataMaker = maker
            } else if (maker instanceof AaFileSrc) {
                this.fileSrcDataMaker = maker
            }
        }
    }

    /**
     * @protected
     * @param maker
     * @param defaultMaker
     * @return {*}
     */
    static maker(maker, defaultMaker) {
        if (typeof maker !== "function") {
            maker = defaultMaker
        }
        if (typeof maker !== "function") {
            log.warn('miss oss data maker defined in _aaEditor')
        }
        return maker
    }

    /**
     *
     * @param {HTMLElement|string} dom    id: #ID, class: .className
     * @param imgSrcDataMaker
     */
    decodeDom(dom, imgSrcDataMaker) {
        const itself = AaEditor
        if (typeof dom === "string") {
            dom = document.querySelector(dom)
        }
        dom.querySelectorAll('a').forEach(a => {
            a.setAttribute('target', '_blank')
        })

        dom.querySelectorAll("abbr[data-privacy-key]").forEach(abbr => {
            abbr.innerHTML = htmls.fuzzy(abbr.innerHTML)
        })
        dom.querySelectorAll("img").forEach(t => {
            const src = t.getAttribute('src')
            const path = t.dataset.path
            if (!!src || !path) {
                return
            }

            imgSrcDataMaker = itself.maker(imgSrcDataMaker, this.imgSrcDataMaker)
            if (typeof imgSrcDataMaker !== "function") {
                return
            }

            const imgsrc = this.#oss.imgSrc(imgSrcDataMaker(path))
            const fa = imgsrc.resize(MAX)
            t.setAttribute("src", fa['url'])
            if (fa.height > 0) {
                t.setAttribute("height", String(fa.width))
            }
            if (fa.width > 0) {
                t.setAttribute("width", String(fa.width))
            }

        })
    }


    // content 一般由编辑器编辑，这里无法实时获取，因此传参更适合
    /**
     *
     * @param {string} content
     * @param {ImgSrcDataMaker} [imgSrcDataMaker]
     * @return {string}
     */

    decodeContent(content, imgSrcDataMaker) {
        const itself = AaEditor

        content = htmls.fuzzy(content)
        imgSrcDataMaker = itself.maker(imgSrcDataMaker, this.imgSrcDataMaker)
        if (typeof imgSrcDataMaker !== "function") {
            return content
        }
        content = content.replace(/(<img\s[^>]*data-path=")([^"]+)"/ig, (match, a, path) => {
            const imgsrc = this.#oss.imgSrc(imgSrcDataMaker(path))
            const fa = imgsrc.resize(MAX) // aa.oss.imgSrc(provider(path)).resize(MAX)
            let attr = a + path + '" src="' + fa.url + '"'
            if (fa.height > 0) {
                attr += ' height="' + fa.height + '"'
            }
            if (fa.width > 0) {
                attr += ' width="' + fa.width + '"'
            }
            return attr
        })
        return content
    }


    /**
     * Clean up HTML content
     * @param content
     */
    cleanContent(content) {
        const whites = this.whiteList

        // 替换所有标签两边多余空格
        content = content.replace(/<div[^>]*>\s*(<img[^>]+>)\s*<\/div>/ig, '<figure>$1</figure>');


        content = content.replace(/<div/ig, '<p');
        content = content.replace(/<\/div>/ig, '</p>');
        // 这个要放最上面
        content = content.replace(/(<figure[^>]*>.*?)((<p\s+style\s*=\s*"\s*text-align:\s*(left|right|justify)[^"]*"[^>]*>.*?<\/p>[\r\n\s]*)+)<\/figure>/ig, '$1</figure>$2');
        content = content.replace(/(<figure[^>]*>.*?)((<p\s+class\s*=\s*"(xl|xr|xj)"[^>]*>.*?<\/p>[\r\n\s]*)+)<\/figure>/ig, '$1</figure>$2');

        content = content.replace(/style\s*=\s*"\s*text-align:\s*left[^"]*"/ig, 'class="xl"');  // figure 里面可能会有这个
        content = content.replace(/style\s*=\s*"[^"]*text-align:\s*center[^"]*"/ig, 'class="xc"');
        content = content.replace(/style\s*=\s*"[^"]*text-align:\s*right[^"]*"/ig, 'class="xr"');
        content = content.replace(/style\s*=\s*"[^"]*text-align:\s*justify[^"]*"/ig, 'class="xj"');

        // refer to  SensitiveBackgroundColor
        content = content.replace(/<span[^>]+style\s*=\s*"[^"]*background-color\s*:\s*rgb\(\s*171,\s*205,\s*239\s*\)[^"]*"[^>]*>\s*([^<]+)\s*<\/span>/ig, '<privacy>$1</privacy>');

        content = content.replace(/style\s*=\s*"[^"]*\s*"/ig, '');
        content = content.replace(/>[\s\t\n]*([^<]*)[\s\t\n]*</ig, '>$1<');
        content = content.replace(/\s*background(-color)\s*:\s*initial\s*;?/ig, '');
        content = content.replace(/<span\s*>\s*([^<]+)\s*<\/span>/ig, '$1');
        content = content.replace(/<p>(&nbsp;)+/ig, '<p>')
        content = content.replace(/(&nbsp;)+<\/p>/ig, '</p>')
        content = content.replace(/<p>(<br\s*\/?\s*>|&nbsp;|\s|\t|\n)*<\/p>/ig, '');

        content = content.replace(/<a\s[^"]*href="([^"]+)"([^>]*)>/ig, function (html, url, others) {
            return '<a href="' + url + '"' + others + ' rel="nofollow">';
        });

        content = content.replace(/<\/?span>/ig, '')  // 移除所有 空span。  后面提交的时候，再移除所有span

        content = content.replace(/<\/?span[^>]*>/ig, '')  // 移除所有 span
        content = content.replace(/\sstyle\s*=\s*"\s*text-align:\s*left[^"]*"/ig, '');
        content = content.replace(/\sclass\s*=\s*"\s*xl"/ig, '');
        // 删除所有  img src
        content = content.replace(/<img\s([^>]*)\s*src="([^\">]*)"([^>]*)data\-path="([^">]+)"/ig, '<img data-path="$4"$1$3')
        content = content.replace(/<img\s([^>]*)\s*data\-path="([^">]+)"([^>]*)src="([^\">]*)"/ig, '<img data-path="$2"$1$3')
        content = content.replace(/<img\sdata-path="([^"]+)"\s+/ig, '<img data-path="$1" ')

        content = content.replace(/class="([^"]*)"/ig, function (html, className) {
            let aaArticlePrefix = "aa-article"
            // 仅允许 .x 开头 以及 .aa-article 开头的 className，或者在白名单的
            if (className[0] !== 'x' && className.substring(0, aaArticlePrefix.length) !== aaArticlePrefix) {
                let isWhiteClass = false
                if (whites) {
                    for (let i = 0; i < whites.length; i++) {
                        if (whites[i].substring(0, 1) === '.' && className === whites[i]) {
                            isWhiteClass = true
                            break
                        }
                    }
                }
                if (!isWhiteClass) {
                    return ''
                }
            }
            return 'class="' + className + '"'
        })

        // @patch：当选中图片，右键再按换行，会把图片外面<figure>变成<p>
        content = content.replace(/<p>[^<]*(<(img|video|source|object|embed)[^>]+\/?>)[^<]*<\/p>/ig, '<$2>$1</$2>');
        content = htmls.encode(content)
        return content;
    }
}