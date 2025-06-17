"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusEventType = void 0;
var MusEventType;
(function (MusEventType) {
    MusEventType[MusEventType["ReleaseNote"] = 0] = "ReleaseNote";
    MusEventType[MusEventType["PlayNote"] = 1] = "PlayNote";
    MusEventType[MusEventType["PitchBend"] = 2] = "PitchBend";
    MusEventType[MusEventType["SystemEvent"] = 3] = "SystemEvent";
    MusEventType[MusEventType["Controller"] = 4] = "Controller";
    MusEventType[MusEventType["EndOfMeasure"] = 5] = "EndOfMeasure";
    MusEventType[MusEventType["Finish"] = 6] = "Finish";
    MusEventType[MusEventType["Unused"] = 7] = "Unused";
})(MusEventType = exports.MusEventType || (exports.MusEventType = {}));
