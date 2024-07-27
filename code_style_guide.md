# Code Style Guide

# JSDoc types
 
```js
/**
 * @type (number|string)[]
 */
const numOrStrArray = [1, 2, 3, '4', '5', 6, 7]

/**
 * @type {{name:string, age:number}[]}
 */

const structArray = [
    {name  : "aario",
        age: 18
    },
    {name  : "Aario",
        age: 28
    },
    {name  : "AARIO",
        age: 38
    },
]

// @warn struct must be enclosed in {{ }}
/**
 * @type {{a:string, b?:number, c:number}}    b?: optional
 */
const definedStruct = {
    a: "Aario",
    c: 100
}


/**
 * @type {(x:number, y:number)=>void}
 */
const fn = (x, y) => {
}
```

## forEach((value, key) =>{})

```js
[].forEach((value, index) => {
})
new Map().forEach((value, key, map) => {

})
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

1. variable keep word `name`, to name this class
2. static Constants
3. static variables
4. private static #variables       ---> 尽量不要使用私有静态变量!!!
5. variables
6. private #variables
7. setXXX()         set property
8. getXXX()         get property 
9. set xxx(value)   set property
10. get xxx()       get property
11. len()
12. initXXX()
13. init()
14. constructor()
15. other methods()
16. valueOf()
17. toString()
18. toJSON()
19. log()
20. static methods()

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