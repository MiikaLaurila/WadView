"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMid = void 0;
var writeMidHead_1 = require("./writeMidHead");
var writeMidTrackBlock_1 = require("./writeMidTrackBlock");
var writeMidEvent_1 = require("./writeMidEvent");
var writeMidTempo_1 = require("./writeMidTempo");
var stream_1 = require("./stream");
var DataOffset = 22;
var LengthOffset = DataOffset - 4;
var writeMid = function (mus) {
    var file = new stream_1.MemStream();
    var context = {
        file: file,
        offset: 0
    };
    writeMidHead_1.writeMidHead(context);
    writeMidTrackBlock_1.writeMidTrackBlock(context);
    writeMidTempo_1.writeMidTempo(context);
    var delay = 0;
    for (var _i = 0, _a = mus.track.events; _i < _a.length; _i++) {
        var event_1 = _a[_i];
        writeMidEvent_1.writeMidEvent(context, event_1, delay);
        delay = event_1.delay;
    }
    // Write the length in the track block
    var buffer = file.read(context.offset);
    buffer.writeUInt32BE(context.offset - DataOffset, LengthOffset);
    return buffer;
};
exports.writeMid = writeMid;
