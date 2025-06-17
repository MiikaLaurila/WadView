"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readMusEvent = void 0;
var MusEvent_1 = require("../interfaces/MusEvent");
var readReleaseNote_1 = require("./readReleaseNote");
var peekEventType_1 = require("./peekEventType");
var readPlayNote_1 = require("./readPlayNote");
var readPitchBend_1 = require("./readPitchBend");
var readSystemEvent_1 = require("./readSystemEvent");
var readGenericEvent_1 = require("./readGenericEvent");
var readController_1 = require("./readController");
var readMusEvent = function (context) {
    switch (peekEventType_1.peekEventType(context)) {
        case MusEvent_1.MusEventType.ReleaseNote:
            return readReleaseNote_1.readReleaseNote(context);
        case MusEvent_1.MusEventType.PlayNote:
            return readPlayNote_1.readPlayNote(context);
        case MusEvent_1.MusEventType.PitchBend:
            return readPitchBend_1.readPitchBend(context);
        case MusEvent_1.MusEventType.SystemEvent:
            return readSystemEvent_1.readSystemEvent(context);
        case MusEvent_1.MusEventType.Controller:
            return readController_1.readController(context);
        default:
            return readGenericEvent_1.readGenericEvent(context);
    }
};
exports.readMusEvent = readMusEvent;
