"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPitchBend = void 0;
var readEventByte_1 = require("./readEventByte");
var readDelay_1 = require("./readDelay");
var readPitchBend = function (context) {
    var byte = readEventByte_1.readEventByte(context);
    var amount = context.file.readUInt8(context.offset++);
    var delay = readDelay_1.readDelay(context, byte.last);
    return {
        delay: delay,
        type: byte.type,
        channel: byte.channel,
        amount: amount
    };
};
exports.readPitchBend = readPitchBend;
