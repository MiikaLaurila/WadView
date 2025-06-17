"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMidDelay = void 0;
var write_1 = require("./write");
var writeByte = function (context, amount, last) {
    if (!last) {
        amount |= 0x80;
    }
    write_1.write8(context, amount);
};
var writeMidDelay = function (context, delay) {
    delay *= 4; // determined experimentally :S
    if (delay >= 2097152) {
        writeByte(context, (delay & 266338304) >> 21, false);
    }
    if (delay >= 0x4000) {
        writeByte(context, (delay & 2080768) >> 14, false);
    }
    if (delay >= 0x80) {
        writeByte(context, (delay & 0x3f80) >> 7, false);
    }
    writeByte(context, (delay & 0x7f), true);
};
exports.writeMidDelay = writeMidDelay;
