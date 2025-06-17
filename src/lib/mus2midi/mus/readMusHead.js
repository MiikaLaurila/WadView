"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readMusHead = void 0;
var readMusHead = function (context) {
    var i = 0;
    var file = context.file;
    var signature = [file.readUInt8(i++), file.readUInt8(i++), file.readUInt8(i++), file.readUInt8(i++)];
    var lenSong = file.readUInt16LE(i);
    i += 2;
    var offSong = file.readUInt16LE(i);
    i += 2;
    var primaryChannels = file.readUInt16LE(i);
    i += 2;
    var secondaryChannels = file.readUInt16LE(i);
    i += 2;
    var numInstruments = file.readUInt16LE(i);
    i += 2;
    var reserved = file.readUInt16LE(i);
    i += 2;
    var instruments = [];
    for (var j = 0; j < numInstruments; j++) {
        instruments.push(file.readUInt16LE(i));
        i += 2;
    }
    context.offset = i;
    return {
        signature: signature,
        lenSong: lenSong,
        offSong: offSong,
        primaryChannels: primaryChannels,
        secondaryChannels: secondaryChannels,
        numInstruments: numInstruments,
        reserved: reserved,
        instruments: instruments
    };
};
exports.readMusHead = readMusHead;
