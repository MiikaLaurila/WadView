"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readDelay = void 0;
var readDelay = function (context, last) {
    if (!last) {
        return 0;
    }
    var byte = 0x80;
    var delay = 0;
    while ((byte & 0x80) === 0x80) {
        byte = context.file.readUInt8(context.offset++);
        delay = delay * 128 + (byte & 0x7f);
    }
    return delay;
};
exports.readDelay = readDelay;
