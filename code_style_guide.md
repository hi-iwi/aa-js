# Code Style Guide

## cookie name rule
cookie-name       = token
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