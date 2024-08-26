// (10).is("10") ===> true
Number.prototype.is = function (b) {
    return this === number(b)
}
