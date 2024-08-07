# Code Style Guide

## 命名规则

* _fields_: []string|{[key:string}:typeFunc}    :  一个类似结构体或object的class，用 _files_ :["key"]   来描述有效字段。主要用于
  map.merge/strictMerge/overwrite

* (vv, vk, defaultV) ====>  (vk ? (vv[vk] ? vv[vk] : defaultV) : vv )
    * Golang 至今未支持三元写法，因此不代表某种习惯就必须要所有人接受。这里规定一种写法并无障碍，并非强制性要求。
    * 等同于  (vk ? (vv[vk] ? vv[vk] : defaultV) : vv )，尚未习惯的，可以使用这种常规写法
* ::new()
* .clone()  ===> 深度复制该类
* .init(data)   ===> 重置数据
    * 注意：.init() 不能返回 this，也不能传递本对象来重新赋值。因为内部无法修改 this 指针。

# JSDoc types

* 使用 `/** @type {xxx} */` ，而不是 `// @type {xxx}`。后者编辑器无法识别

```js
/** @type (number|string)[] */
const numOrStrArray = [1, 2, 3, '4', '5', 6, 7]

/** @type {{name:string, age:number}[]} */

const structArray = [
    {
        name: "aario",
        age : 18
    },
    {
        name: "Aario",
        age : 28
    },
    {
        name: "AARIO",
        age : 38
    },
]

// @warn struct must be enclosed in {{ }}
/** @type {{a:string, b?:number, c:number}}    b?: optional */
const definedStruct = {
    a: "Aario",
    c: 100
}


/**  @type {(x:number, y:number)=>void} */
const fn = (x, y) => {
}
```

## forEach((key, value) =>{})

(value, key) 是反人性的，(key, value) 才更符合人类思维，减少人类出错

### 例外情况：

```js
[].forEach((value, index) => {
})
new Map().forEach((value, key, map) => {

})
```

## base class interface

* 通用命名规则
    * toJSON()    JSON.stringify() 能识别该方法； aa fetch 也需要识别该方法序列化对象
    * toString()  '' + new Date() 会用该方法返回的string
    * valueOf()  +new Date() 会用该方法返回的number
    *

```
// pseudo-code
interface BaseClass {
    ?get len:number     
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

## cookie name rule

cookie-name = token

## Rules

* Don't name private method with name #keyname()/#keyName , it won't compile.


* token表示的是除了分隔符和CTLs以外的ASCII字符
* 分隔符包括:
* 小中大尖括号 "("|")"|"[]"|"]"|"{"|"}"|"<"|">"
* 空格和水平制表符 SP | HT
* 逗号分号冒号引号问号等号 ","|";"|":"|"?"|"="|"\""
* 斜线: "\" | "/"
* @: "@"

### class 属性顺序

按字母排序

1. variable keep word `name`, to name this class
2. static Constants
3. static variables
4. private static #variables ---> 尽量不要使用私有静态变量!!!
5. variables
6. private #variables
7. setXXX()         set property
8. getXXX()         get property
9. set xxx(value)   set property
10. get xxx()       get property
11. data()
12. initXXX()
13. init()
14. constructor()
15. #private methods
16. \* [xxx]()   如  *[Symbol.iterator](){yield xxx}
17. [xxx]()    如  [Symbol.iterator](){return [].values()}
17. other methods()
18. static methods()   ---> 禁止存在 静态私有变量

```js
class Demo {
    name = 'demo'   // keep word to name the class

    static ConstantData = 1   // static constant starts with biggercase, and list in front of other properties/methods
    static Name = "constant"  // constant is unmodifable

    static name = 'Aario'    // static variables starts with lowercase, it's changable
    static #age = 18   // private static variables start with #

    hundsome = true
    #nationality = 'China'

    // len() 函数会识别这个
    get len() {

    }

    get nationality() {
        return this.#nationality
    }

    set nationality(nationality) {
        this.#nationality = nationality
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

## Use sentence-case style to comment or print

```javascript
/**
 * Use sentence-case style to comment or print
 * @return {*}
 */
function test() {
    return
}


const errmsg = "Bad gateway"   // sentence-case style to print
```

## Private Global Variable Names

We add one or more underscores before or after the global variable name to indicate a private variable.
Do not use these private variables out of scope.

```javascript
var _aaDebugStatus_ = 1
var _aa = "LOVE"
var hello_ = "HI"  
```

## Enum

Always use BigCamelCase to name enums' key names.

```javascript
const sex = {
    Male  : 0,
    Female: 1
}
const Fruit = {
    Apple : "apple",
    Orange: "organge"
}
```