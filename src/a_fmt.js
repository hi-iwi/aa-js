// 基础static class
class fmt {
    name = 'aa-fmt'
    static #CHINESE_NUMBERS = Object.freeze({
        default: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
        financial: ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
    });

    static #UNITS = Object.freeze({
        default: ['个', '万', '亿', '万亿', '兆'],
        suffix: ['', '十', '百', '千'],
        financial: {
            suffix: ['', '拾', '佰', '仟']
        }
    });

    /**
     * 优化参数处理，移除尾部的 undefined 参数
     * @param {any[]} args 
     * @returns {any[]}
     */
    static args(...args) {
        const lastDefinedIndex = args.findLastIndex(arg => arg !== undefined);
        return lastDefinedIndex === -1 ? [] : args.slice(0, lastDefinedIndex + 1);
    }

    /**
     * Capitalize the first letter of each word and leave the other letters lowercase
     * @param {string} s  separate words with spaces, underscore(_) or hyphen(-)
     * @param {boolean} handleCases
     */
    static capitalizeEachWord(s, handleCases = false) {
        if (handleCases) {
            s = fmt.toSnakeCase(s).replaceAll('_', ' ')
        }
        s = s.replace(/(^|[\s_-])([a-z])/g, function (x, y, z) {
            return y + z.toUpperCase()
        })
        return s
    }

    /**
     * 字符串格式化
     * @param {string} format 
     * @param  {...any} args 
     * @returns {string}
     */
    static sprintf(format, ...args) {
        const matches = format.match(/%s/ig)?.length ?? 0;

        if (matches !== args.length) {
            log.error(`fmt.sprintf("${format}", ${args}) invalid number of arguments, expected ${matches}, but got ${args.length}.`);
        }

        return format.replace(/%s/ig, () => args.shift());
    }

    /**
     * Translate formatted string
     * @param {?struct} dict
     * @param args
     * @return {string}
     * @example fmt.translate({'I LOVE %s':'我爱%s'}, "I LOVE %s", "你")    ===>   我爱你
     */
    static translate(dict, ...args) {
        if (len(dict) === 0 || args.length < 1) {
            return ""
        }
        let format = dict && dict[args[0]] ? dict[args[0]] : args[0]
        return fmt.sprintf(format, ...args.slice(1))
    }

    /**
     * 转换为驼峰命名  convert UPPER_UNDERSCORE_CASE/snake_case/PascalCase/kebab-case to  camelCase
     * @param {string } s
     * @return {string}
     */
    static toCamelCase(s) {
        return s.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
    }
    /**
        * 转换为Pascal命名
        * @param {string} s
        * @return {string}
        */
    static toPascalCase(s) {
        return this.toCamelCase(s).replace(/^[a-z]/, c => c.toUpperCase());
    }

    /**
     * 转换为下划线命名  convert UPPER_UNDERSCORE_CASE/PascalCase/camelCase/kebab-case to lower-case snake case(underscore_case)
     * @param {string} s
     * @return {string}
     */
    static toSnakeCase(s) {
        s = s.replaceAll('-', '_')  // kebab-case
        const isPascal = s && (s[0] >= 'A' && s[0] <= 'Z')
        s = s.replace(/_?([A-Z]+)/g,  (_, y) => "_" + y.toLowerCase())
        return isPascal ? s.trimStart('_', 1) : s
    }
    /**
     * Convert to sentence-case
     * @param {string} s
     * @param {boolean} handleCases
     * @return {string}
     */
    static toSentenceCase(s, handleCases = false) {
        if (handleCases) {
            s = fmt.toSnakeCase(s).replaceAll('_', ' ')
        }
        return !s ? "" : s[0].toUpperCase() + s.substring(1)
    }
    /**
     * 将数字转换为中文数字
     * @param {number|string} num 
     * @param {boolean} financial 
     * @returns {string}
     */
    static toChineseNumber(num, financial = false) {
        // 参数验证和特殊情况处理
        if (num === 0) return '零';
        const numStr = String(num);
        
        if (numStr.includes('.')) {
            const [integer, decimal] = numStr.split('.');
            const decimalChinese = Array.from(decimal)
                .map(d => this.#CHINESE_NUMBERS[financial ? 'financial' : 'default'][d])
                .join('');
            return `${this.toChineseNumber(integer, financial)}点${decimalChinese}`;
        }

        if (!/^\d+$/.test(numStr)) {
            throw new Error('Not a number');
        }
        if (numStr.length > 20) {
            throw new Error('Number is too large');
        }

        // 获取配置
        const numbers = this.#CHINESE_NUMBERS[financial ? 'financial' : 'default'];
        const units = this.#UNITS.default;
        const suffix = financial ? this.#UNITS.financial.suffix : this.#UNITS.suffix;

        // 数字分组处理
        const groups = this.#splitNumberIntoGroups(numStr);
        
        // 转换为中文
        let result = this.#convertGroupsToChinese(groups, numbers, units, suffix);
        
        // 后处理
        result = this.#postProcessChineseNumber(result, units);
        
        return result;
    }

    /**
     * 将数字分组（每4位一组）
     * @private
     */
    static #splitNumberIntoGroups(numStr) {
        const digits = numStr.split('').reverse();
        const groups = [];
        while (digits.length) {
            groups.push(digits.splice(0, 4));
        }
        return groups;
    }

    /**
     * 将分组转换为中文
     * @private
     */
    static #convertGroupsToChinese(groups, numbers, units, suffix) {
        return groups.map((group, groupIndex) => {
            const groupChinese = group.map((digit, digitIndex) => 
                numbers[digit] + suffix[digitIndex]
            ).reverse().join('');
            return groupChinese + units[groupIndex % 6];
        }).reverse().join('');
    }

    /**
     * 中文数字后处理（处理零的显示等）
     * @private
     */
    static #postProcessChineseNumber(result, units) {
        // 处理连续的零
        result = result.replace(/零+/g, '零')
            .replace(/零+$/, '')
            .replace(/^一十/, '十')
            .replace(/个$/, '');

        // 处理单位
        for (let i = units.length - 1; i >= 0; i--) {
            const unit = units[i];
            result = result.replace(
                new RegExp(`(零+)${unit}`, 'g'), 
                (_, zeros) => zeros.length === 4 ? '' : unit
            );
        }

        return result;
    }




}