"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMidEndOfTrack = void 0;
var write_1 = require("./write");
var writeMidDelay_1 = require("./writeMidDelay");
var MetaEvent = 0xff;
var EndOfTrack = 0x2f;
var writeMidEndOfTrack = function (context) {
    write_1.write8(context, MetaEvent);
    write_1.write8(context, EndOfTrack);
    writeMidDelay_1.writeMidDelay(context, 0); // The length of this data is 0
};
exports.writeMidEndOfTrack = writeMidEndOfTrack;
