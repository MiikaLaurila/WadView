"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMidNoteOff = void 0;
var write_1 = require("./write");
var MidEventType;
(function (MidEventType) {
    MidEventType[MidEventType["NoteOff"] = 128] = "NoteOff";
})(MidEventType || (MidEventType = {}));
var writeMidNoteOff = function (context, event) {
    write_1.write8(context, MidEventType.NoteOff | event.channel);
    write_1.write8(context, event.note);
    write_1.write8(context, event.volume);
};
exports.writeMidNoteOff = writeMidNoteOff;
