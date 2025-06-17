"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMidController = void 0;
var write_1 = require("./write");
var MidEventType;
(function (MidEventType) {
    MidEventType[MidEventType["Controller"] = 176] = "Controller";
})(MidEventType || (MidEventType = {}));
var MusToMidi = (_a = {},
    _a[1] = 0,
    _a[2] = 1,
    _a[3] = 7,
    _a[4] = 10,
    _a[5] = 11,
    _a[6] = 91,
    _a[7] = 93,
    _a[8] = 64,
    _a[9] = 67,
    _a[10] = 120,
    _a[11] = 123,
    _a[12] = 126,
    _a[13] = 127,
    _a[14] = 121,
    _a);
var writeMidController = function (context, event) {
    write_1.write8(context, MidEventType.Controller | event.channel);
    write_1.write8(context, MusToMidi[event.controller]);
    write_1.write8(context, event.value);
};
exports.writeMidController = writeMidController;
