class AaCrypto {
    static convertStdBas464ToURLSafe(s){
        // 替换 + 为 -, / 为 _
        return s.replace(/\+/g, '-').replace(/\//g,'_')
    }
    static convertURLSafeBase64ToStd(s){
        return s.replace(/-/g, '+').replace(/_/g,'/')
    }
    static encodeBase64(s, urlSafe = false, withoutPadding= false){
        // 系统 btoa
         s = btoa(s)
        // 替换 + 为 -, / 为 _
        if (urlSafe){
            s = this.convertStdBas464ToURLSafe(s)
        }
        if (withoutPadding){
            s = s.replace(/=+$/,'')
        }
        return s
    }

    /**
     * 通用Base64解码（含URL-Safe类型和标准类型，以及填充与不填充）
     * @param s
     */
    static decodeBase64(s){
        let l = s.length
        if (l ===0){
            return ""
        }
        // 替换URL safe为STD模式
         s = this.convertURLSafeBase64ToStd(s)
        // 系统 atob 无论是否带padding，都能解析
        return atob(s)
    }
    /**
     * 格式化RAS PKCS8 public key为标准格式
     * @param key  编码后的Base64 PEM。可能是基于DER base64后未格式化的格式
     * @return {*}
     */
    static standardizeRASPublicKey(key){
        const lineLength = 64  // 每行64字符
        const prefix = "-----BEGIN PUBLIC KEY-----\n"
        const suffix = "-----END PUBLIC KEY-----\n"
        if (key.indexOf(prefix)===0){
            return key
        }
        let s = prefix
        for (let i=0;i<key.length;i+=lineLength){
            let end = i+lineLength
            if (end > key.length ){
                end = key.length
            }
            s += key.substring(i,end) + '\n'
        }
        s += suffix
        return  s
    }

}