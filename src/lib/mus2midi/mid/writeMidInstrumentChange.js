"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMidInstrumentChange = void 0;
var write_1 = require("./write");
var MidEventType;
(function (MidEventType) {
    MidEventType[MidEventType["InstrumentChange"] = 192] = "InstrumentChange";
})(MidEventType || (MidEventType = {}));
var writeMidInstrumentChange = function (context, event) {
    write_1.write8(context, MidEventType.InstrumentChange | event.channel);
    write_1.write8(context, event.value);
};
exports.writeMidInstrumentChange = writeMidInstrumentChange;
