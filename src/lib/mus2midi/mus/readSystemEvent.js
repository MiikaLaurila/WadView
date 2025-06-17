"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSystemEvent = void 0;
var readEventByte_1 = require("./readEventByte");
var readDelay_1 = require("./readDelay");
var readSystemEvent = function (context) {
    var byte = readEventByte_1.readEventByte(context);
    var controller = context.file.readUInt8(context.offset++) & 0x7f;
    if (controller < 10 || controller > 15) {
        console.error("Unknown MUS system event controller " + controller);
        return null;
    }
    var delay = readDelay_1.readDelay(context, byte.last);
    return {
        delay: delay,
        type: byte.type,
        channel: byte.channel,
        controller: controller
    };
};
exports.readSystemEvent = readSystemEvent;
