# aa.js  AaGo 后端 JS SDK

A Javascript SDK of AaGo

这里要依赖于抽象，而不具体实现。实现尽量通过外部注入。

## 入口方法

* aa = new Aa()

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

* AErrorEnum
* AError
* AaTx
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
*
    * slice.xxx
* type convert: cast (vv, vk) to such type
    * string()
    * number()
    * struct()   map struct {[key:string]:*}
    * array()
    * date()     keep word: convert to YYYY-MM-DD format string
    * datetime() keep word: convert to YYYY-MM-DD HH:II:SS format string
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

* _fields_: []string|{[key:string}:typeFunc}    :  一个类似结构体或object的class，用 _files_ :["key"]   来描述有效字段。主要用于
  map.merge/strictMerge/overwrite

* (vv, vk)   ====>  vk ? vv[vk] : vv
* ::new()
* .clone()  ===> 深度复制该类
* .init(data)   ===> 重置数据
    * 注意：.init() 不能返回 this，也不能传递本对象来重新赋值。因为内部无法修改 this 指针。


* 通用命名规则
    * toJSON()    JSON.stringify() 能识别该方法； aa fetch 也需要识别该方法序列化对象
    * toString()  '' + new Date() 会用该方法返回的string
    * valueOf()  +new Date() 会用该方法返回的number

### class 属性顺序

1. variable keep word `name`, to name this class
2. static Constants
3. static variables
4. private static #variables
5. variables
6. private #variables
7. get
8. set
9. len()
10. initXXX()
11. init()
12. constructor()
13. other methods()
14. valueOf()
15. toString()
16. toJSON()
17. log()
18. static methods()

```js
class Demo {
    name = 'demo'   // keep word to name the class

    static ConstantData = 1   // static constant starts with biggercase, and list in front of other properties/methods
    static Name = "constant"  // constant is unmodifable

    static name = 'Aario'    // static variables starts with lowercase, it's changable
    static #age = 18   // private static variables start with #

    hundsome = true
    #nationality = 'China'

    get nationality() {
        return this.#nationality
    }

    set nationality(nationality) {
        this.#nationality = nationality
    }

    len() {   // a special method

    }

    initAge(age) {
        this.#age = age
    }

    init() {                // a special method

    }

    constructor() {
        this.init()
     }

    otherMethod() {

    }

    valueOf() {

    }

    toString() {

    }

    toJSON() {

    }

    log() {

    }

    static sayHello() {
        alert("Hello")
    }
}
```


