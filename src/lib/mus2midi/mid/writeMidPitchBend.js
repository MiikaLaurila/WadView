"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMidPitchBend = void 0;
var write_1 = require("./write");
var MidEventType;
(function (MidEventType) {
    MidEventType[MidEventType["PitchBend"] = 224] = "PitchBend";
})(MidEventType || (MidEventType = {}));
var writeMidPitchBend = function (context, event) {
    var msb = event.amount >> 1;
    var lsb = (event.amount << 7) & 0x80;
    write_1.write8(context, MidEventType.PitchBend | event.channel);
    write_1.write8(context, lsb); // Convert amount from 8 to 14 bit :S
    write_1.write8(context, msb); // Convert amount from 8 to 14 bit
};
exports.writeMidPitchBend = writeMidPitchBend;
