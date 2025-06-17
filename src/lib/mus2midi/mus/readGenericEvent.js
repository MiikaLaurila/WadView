"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readGenericEvent = void 0;
var readEventByte_1 = require("./readEventByte");
var readDelay_1 = require("./readDelay");
var readGenericEvent = function (context) {
    var byte = readEventByte_1.readEventByte(context);
    var delay = readDelay_1.readDelay(context, byte.last);
    return {
        delay: delay,
        type: byte.type,
        channel: byte.channel
    };
};
exports.readGenericEvent = readGenericEvent;
