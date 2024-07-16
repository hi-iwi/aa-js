# Code Style Guide

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