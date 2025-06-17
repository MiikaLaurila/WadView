"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPlayNote = void 0;
var readEventByte_1 = require("./readEventByte");
var readDelay_1 = require("./readDelay");
var readPlayNote = function (context) {
    var _a;
    var byte = readEventByte_1.readEventByte(context);
    var note = context.file.readUInt8(context.offset++);
    var hasVolume = (note & 0x80) === 0x80;
    var channel = (_a = context.channels[byte.channel]) !== null && _a !== void 0 ? _a : { volume: 100 };
    if (hasVolume) {
        channel.volume = context.file.readUInt8(context.offset++) & 0x7f;
    }
    var delay = readDelay_1.readDelay(context, byte.last);
    return {
        delay: delay,
        type: byte.type,
        channel: byte.channel,
        note: note & 0x7f,
        volume: channel.volume
    };
};
exports.readPlayNote = readPlayNote;
