"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemStream = void 0;
var MemStream = /** @class */ (function () {
    function MemStream() {
        this.size = 100;
        this.position = 0;
        this.data = [100];
    }
    MemStream.prototype.write = function (buffer) {
        var _a, _b;
        if (this.position + buffer.length > this.size) {
            (_a = this.data).push.apply(_a, new Array(this.size));
            this.size *= 2;
        }
        var array = Array.from(buffer);
        (_b = this.data).splice.apply(_b, __spreadArray([this.position, array.length], array));
        this.position += array.length;
    };
    MemStream.prototype.read = function (length) {
        return Buffer.from(this.data.slice(0, length));
    };
    return MemStream;
}());
exports.MemStream = MemStream;
