# aa.js  基础库

这里要依赖于抽象，而不具体实现。实现尽量通过外部注入。

## Entry

```javascript
const aa = new Aa()
aa.storage.setCookieStorage(xxx)


```

## 入口方法

* aa = new Aa()
    * .uri: typeof _aaUri
    * .math: typeof _aaMath
    * .env: _aaEnv
    * .url(): _aaUrl
    * .fetch(): _aaFetch
    * .apollo(): _aaApollo

## 全局变量

下划线开头的变量表示private私有变量，禁止外部使用！

nif nil function
defval()   defined value
len()      length of everything

not()     
nullable()

* atype{} type check
* type convert: cast (vv, vk) to such type
    * string()
    * number()
    * struct()   map struct {[key:string]:*}
    * array()
    * date()     convert to YYYY-MM-DD format string
    * datetime() convert to YYYY-MM-DD HH:II:SS format string
    * func()     convert to function
    * bool()
    * booln()  convert to boolean number
    * float64()
    * float32()
    * int64a() cast to int64 number string
    * int32()
    * int24()
    * int16()
    * int8()
    * uint64a() cast to uint64 number string
    * uint32()
    * uint24()
    * uint16()
    * uint8()

## 通用参数规则

* (vv, vk)   ====>  vk ? vv[vk] : vv
* .clone()  ===> 深度复制该类
