# aa.js  基础库

这里要依赖于抽象，而不具体实现。实现尽量通过外部注入。

## Entry

```javascript
const aa = new Aa()
aa.storage.initCookieStorage()
aa.fetch.initGlobalHeaders() 


```

## 入口方法

* aa = new Aa()
    * .uri: typeof _aaUri
    * .math: typeof _aaMath
    * .env: _aaEnv
    * .url(): _aaUrl
    * .fetch(): _aaFetch
    * .apollo(): _aaApollo

## base class interface

```
// pseudo-code
interface BaseClass {
    ?valueOf(): any                // refer to .value, if neccessary. e.g. +new Date()  ==> will call this
    ?toString(): string            // '' + new BaseClass()  ===> will call this
    ?toJSON(): string              // for JSON.stringify
    
    readonly name: string    // name of this class
    ?value: any              // the value of this class, if neccessary
}

class XXX{
  constructor(){}
 }

```

## global variables

下划线开头的变量表示private私有变量，禁止外部使用！

* AError
* nif nil function
* defval()   defined value
* len()      length of everything

* not()
* nullable()
* Round()
* RoundTrim()
* RoundAway()
* RoundReverse()

* new atype()  type check
* new map()
* log.xx
* fmt.xx
* type convert: cast (vv, vk) to such type
    * string()
    * number()
    * struct()   map struct {[key:string]:*}
    * array()
    * date()     @deprecated convert to YYYY-MM-DD format string
    * datetime() @deprecated convert to YYYY-MM-DD HH:II:SS format string
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

## 命名规则

* (vv, vk)   ====>  vk ? vv[vk] : vv
* ::new()
* .clone()  ===> 深度复制该类

* 通用命名规则
    * toJSON()    JSON.stringify() 能识别该方法
    * toString()  '' + new Date() 会用该方法返回的string
    * valueOf()  +new Date() 会用该方法返回的number

