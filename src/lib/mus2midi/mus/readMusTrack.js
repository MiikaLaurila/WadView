"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readMusTrack = void 0;
var readMusEvent_1 = require("./readMusEvent");
var readMusTrack = function (head, context) {
    var track = { events: [] };
    while (context.offset < head.lenSong + head.offSong) {
        var musEvent = readMusEvent_1.readMusEvent(context);
        if (musEvent)
            track.events.push(musEvent);
    }
    return track;
};
exports.readMusTrack = readMusTrack;
