"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMidEvent = void 0;
var MusEvent_1 = require("../interfaces/MusEvent");
var writeMidDelay_1 = require("./writeMidDelay");
var writeMidNoteOff_1 = require("./writeMidNoteOff");
var writeMidNoteOn_1 = require("./writeMidNoteOn");
var writeMidPitchBend_1 = require("./writeMidPitchBend");
var writeMidInstrumentChange_1 = require("./writeMidInstrumentChange");
var writeMidController_1 = require("./writeMidController");
var writeMidEndOfTrack_1 = require("./writeMidEndOfTrack");
var convertChannel = function (mus) { return mus === 15 ? 9 : mus; };
var writeMidEvent = function (context, current, delay) {
    var event = __assign(__assign({}, current), { channel: convertChannel(current.channel) });
    writeMidDelay_1.writeMidDelay(context, delay);
    switch (current.type) {
        case MusEvent_1.MusEventType.ReleaseNote:
            writeMidNoteOff_1.writeMidNoteOff(context, event);
            break;
        case MusEvent_1.MusEventType.PlayNote:
            writeMidNoteOn_1.writeMidNoteOn(context, event);
            break;
        case MusEvent_1.MusEventType.PitchBend:
            writeMidPitchBend_1.writeMidPitchBend(context, event);
            break;
        case MusEvent_1.MusEventType.SystemEvent:
            writeMidController_1.writeMidController(context, __assign(__assign({}, event), { value: 0 }));
            break;
        case MusEvent_1.MusEventType.Controller:
            var controllerEvent = event;
            var controller = controllerEvent.controller;
            if (controller === 0x0) {
                writeMidInstrumentChange_1.writeMidInstrumentChange(context, controllerEvent);
            }
            else {
                writeMidController_1.writeMidController(context, controllerEvent);
            }
            break;
        case MusEvent_1.MusEventType.EndOfMeasure:
            break;
        case MusEvent_1.MusEventType.Finish:
            writeMidEndOfTrack_1.writeMidEndOfTrack(context);
            break;
        default:
            console.error("Unexpected MUS Event Type " + current.type);
            break;
    }
};
exports.writeMidEvent = writeMidEvent;
