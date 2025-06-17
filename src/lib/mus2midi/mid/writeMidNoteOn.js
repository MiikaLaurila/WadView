"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMidNoteOn = void 0;
var write_1 = require("./write");
var MidEventType;
(function (MidEventType) {
    MidEventType[MidEventType["NoteOn"] = 144] = "NoteOn";
})(MidEventType || (MidEventType = {}));
var writeMidNoteOn = function (context, event) {
    write_1.write8(context, MidEventType.NoteOn | event.channel);
    write_1.write8(context, event.note);
    write_1.write8(context, event.volume);
};
exports.writeMidNoteOn = writeMidNoteOn;
