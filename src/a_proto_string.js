/**
 * String 原型扩展方法
 */


/**
 * 正则表达式相关方法
 */
Object.assign(String.prototype, {
    /**
     * 转换为正则表达式
     * @param {string} [flags]
     * @return {RegExp}
     */
    toRegExp(flags) {
        return new RegExp(this.toRegSource(), flags);
    },

    /**
     * 转换为正则表达式源字符串
     * @return {string}
     */
    toRegSource() {
        return this.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
});


/**
 * 切割字符串
 * @param {string} separator 分隔符
 * @return {[string, string, boolean]} [前半部分, 后半部分, 是否找到分隔符]
 */
String.prototype.cut = function(separator) {
    separator = String(separator);
    const index = this.indexOf(separator);
    return index >= 0
        ? [this.slice(0, index), this.slice(index + separator.length), true]
        : [this, "", false];
}


/**
 * 字符串连接方法组
 */
Object.assign(String.prototype, {
    /**
     * 使用空格连接字符串
     * @param {...any} args
     * @return {string}
     */
    join(...args) {
        return this.joinWith(' ', ...args);
    },

    /**
     * 条件连接字符串
     * @param {boolean} condition
     * @param {...any} args
     * @return {string}
     */
    joinIf(condition, ...args) {
        return condition ? this.join(...args) : this;
    },

    /**
     * 使用指定分隔符连接字符串
     * @param {string} separator
     * @param {...any} args
     * @return {string}
     */
    joinWith(separator, ...args) {
        let result = this.trim();
        for (const arg of args) {
            if (arg != null && arg !== '') {
                result += result ? separator + arg : arg;
            }
        }
        return result;
    },

    /**
     * 条件使用指定分隔符连接字符串
     * @param {boolean} condition
     * @param {string} separator
     * @param {...any} args
     * @return {string}
     */
    joinWithIf(condition, separator, ...args) {
        return condition ? this.joinWith(separator, ...args) : this;
    }
});

/**
 * 字符串替换方法组
 */
Object.assign(String.prototype, {
    /**
     * 增强的替换所有方法
     * @param {string|RegExp|Object|(string|number|RegExp)[][]|(string|number|RegExp)[]} searchValue
     * @param {string|((match: string, ...args: any[]) => string)} [replaceValue]
     * @return {string}
     * @example
     *  replaceAll("I'm Aario. Hi, Aario!", "Aario", "Tom")  ==> I'm Tom. Hi Tom!
     *  replaceAll("I'm Aario. Hi, Aario!", {
     *      "Aario": "Tom",
     *      "Hi": "Hello",
     *  })  ====>  I'm Tom. Hello Tom!
     *  replaceAll("I'm Aario. Hi, Aario!", [["Aario", "Tom"]])
     */
    replaceAll(searchValue, replaceValue) {
        let result = this;
        const replacements = this.#normalizeReplacements(searchValue, replaceValue);

        for (const [search, replace] of replacements) {
            if (search instanceof RegExp) {
                if (!search.flags.includes('g')) {
                    throw new TypeError('replaceAll must be called with a global RegExp');
                }
                result = result.replace(search, replace);
            } else {
                result = result.split(search).join(replace);
            }
        }
        return result;
    },

    /**
     * 替换结尾匹配的字符串
     * @param {string} searchValue
     * @param {string} replaceValue
     * @return {string}
     */
    replaceEnd(searchValue, replaceValue) {
        return this.endsWith(searchValue)
            ? this.replaceLastMatched(searchValue, replaceValue)
            : this;
    },

    /**
     * 替换第一个匹配的字符串
     * @param {string} searchValue
     * @param {string} replaceValue
     * @return {string}
     */
    replaceFirstMatched(searchValue, replaceValue) {
        const index = this.indexOf(searchValue);
        return index < 0
            ? this
            : this.slice(0, index) + replaceValue + this.slice(index + searchValue.length);
    },

    /**
     * 替换最后一个匹配的字符串
     * @param {string} searchValue
     * @param {string} replaceValue
     * @return {string}
     */
    replaceLastMatched(searchValue, replaceValue) {
        const index = this.lastIndexOf(searchValue);
        return index < 0
            ? this
            : this.slice(0, index) + replaceValue + this.slice(index + searchValue.length);
    },

    /**
     * 替换开头匹配的字符串
     * @param {string} searchValue
     * @param {string} replaceValue
     * @return {string}
     */
    replaceStart(searchValue, replaceValue) {
        return this.startsWith(searchValue)
            ? this.replace(searchValue, replaceValue)
            : this;
    }
});


/**
 * 字符串修剪方法组
 */
Object.assign(String.prototype, {
    /**
     * 分割并修剪
     * @param {string|RegExp} separator
     * @param {number} [limit]
     * @return {string[]}
     */
    splitTrim(separator, limit) {
        return this ? this.split(separator, limit)
            .map(v => v.trim())
            .filter(Boolean) : [];
    },

    /**
     * 修剪指定次数的后缀
     * @param {string|number} [cut=' ']
     * @param {number} [n]
     * @return {string}
     */
    trimEnd(cut = ' ', n) {
        if (typeof cut === 'number') {
            [cut, n] = [' ', cut];
        }

        let result = this;
        const cutLength = cut.length;

        if (!result || result.length < cutLength) {
            return result;
        }

        n = n || result.length;
        let endIndex = result.length;

        while (n > 0 && endIndex >= cutLength &&
        result.substring(endIndex - cutLength, endIndex) === cut) {
            n--;
            endIndex -= cutLength;
        }

        return endIndex < 1 ? '' : result.substring(0, endIndex);
    },

    /**
     * 修剪指定次数的前缀
     * @param {string|number} [cut=' ']
     * @param {number} [n]
     * @return {string}
     */
    trimStart(cut = ' ', n) {
        if (typeof cut === 'number') {
            [cut, n] = [' ', cut];
        }

        let result = this;
        const cutLength = cut.length;

        if (!result || result.length < cutLength) {
            return result;
        }

        n = n || result.length;
        let startIndex = 0;

        while (n > 0 && startIndex <= result.length - cutLength &&
        result.substring(startIndex, startIndex + cutLength) === cut) {
            n--;
            startIndex += cutLength;
        }

        return startIndex > result.length - 1 ? '' : result.substring(startIndex);
    },

    /**
     * 修剪指定次数的前缀和后缀
     * @param {string|number} [cut=' ']
     * @param {number} [n]
     * @return {string}
     */
    trim(cut = ' ', n) {
        return this.trimStart(cut, n).trimEnd(cut, n);
    }
});

/**
 * 私有辅助方法
 */
Object.assign(String.prototype, {
    /**
     * 标准化替换参数
     * @private
     */
    #normalizeReplacements(searchValue, replaceValue) {
        if (Array.isArray(searchValue)) {
            return searchValue.length > 0 && Array.isArray(searchValue[0])
                ? searchValue
                : [searchValue];
        }

        if (typeof searchValue === 'object' && !(searchValue instanceof RegExp)) {
            return Object.entries(searchValue);
        }

        return [[searchValue, replaceValue]];
    }
});