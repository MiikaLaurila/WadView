"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readMus = void 0;
var readMusHead_1 = require("./readMusHead");
var readMusTrack_1 = require("./readMusTrack");
var readMus = function (file) {
    var context = {
        file: file,
        offset: 0,
        volume: 0,
        channels: {}
    };
    var head = readMusHead_1.readMusHead(context);
    var track = readMusTrack_1.readMusTrack(head, context);
    return {
        head: head,
        track: track
    };
};
exports.readMus = readMus;
