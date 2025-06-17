"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readEventByte = void 0;
var readEventByte = function (context) {
    var byte = context.file.readUInt8(context.offset++);
    var last = (byte & 0x80) === 0x80;
    var type = (byte & 0x70) >> 4;
    var channel = byte & 0xf;
    return {
        last: last,
        type: type,
        channel: channel
    };
};
exports.readEventByte = readEventByte;
