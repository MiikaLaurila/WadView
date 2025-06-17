"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMidTrackBlock = void 0;
var Buffer = require('buffer/').Buffer;
var write_1 = require("./write");
var Signature = [0x4d, 0x54, 0x72, 0x6b]; //'MTrk'
var writeMidTrackBlock = function (context) {
    var file = context.file;
    file.write(Buffer.from(Signature));
    context.offset += Signature.length;
    // We won't know the length until we're finished so bookmark the place in the file where
    // we need to write the length and come back to it later
    write_1.write32(context, 0);
};
exports.writeMidTrackBlock = writeMidTrackBlock;
