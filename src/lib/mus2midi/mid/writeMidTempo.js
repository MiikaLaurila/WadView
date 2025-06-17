"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMidTempo = void 0;
var write_1 = require("./write");
var MetaEvent = 0xff;
var SetTempo = 0x51;
// Almost - we are missing 00 FF 51 03 0F 42 40 @ 0x16 - (Set Tempo)
var writeMidTempo = function (context) {
    write_1.write8(context, 0); // 0 delay preceeding this event
    write_1.write8(context, MetaEvent);
    write_1.write8(context, SetTempo);
    write_1.write8(context, 3);
    write_1.write8(context, 0x0f); /*TODO this is hard coded based upon a known good mid file*/
    write_1.write8(context, 0x42);
    write_1.write8(context, 0x40);
};
exports.writeMidTempo = writeMidTempo;
