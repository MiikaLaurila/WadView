"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readReleaseNote = void 0;
var readEventByte_1 = require("./readEventByte");
var readDelay_1 = require("./readDelay");
var readReleaseNote = function (context) {
    var _a;
    var byte = readEventByte_1.readEventByte(context);
    var data = context.file.readUInt8(context.offset++);
    var delay = readDelay_1.readDelay(context, byte.last);
    var channel = (_a = context.channels[byte.channel]) !== null && _a !== void 0 ? _a : { volume: 100 };
    return {
        delay: delay,
        type: byte.type,
        channel: byte.channel,
        note: data & 0x7f,
        volume: channel.volume
    };
};
exports.readReleaseNote = readReleaseNote;
