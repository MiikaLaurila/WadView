"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMidHead = void 0;
var Buffer = require('buffer/').Buffer;
var write_1 = require("./write");
var Signature = [0x4d, 0x54, 0x68, 0x64]; //'MThd'
var writeMidHead = function (context) {
    var ticksPerQuarterNote = 560; /* TODO */
    context.file.write(Buffer.from(Signature));
    context.offset += Signature.length;
    write_1.write32(context, 6 /*iLength*/);
    write_1.write16(context, 0 /*iType*/);
    write_1.write16(context, 1 /*iNumTracks*/);
    write_1.write16(context, ticksPerQuarterNote);
};
exports.writeMidHead = writeMidHead;
