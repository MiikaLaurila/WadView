"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readController = void 0;
var MusControllerType_1 = require("../interfaces/MusControllerType");
var readEventByte_1 = require("./readEventByte");
var readDelay_1 = require("./readDelay");
var readController = function (context) {
    var byte = readEventByte_1.readEventByte(context);
    var controller = context.file.readUInt8(context.offset++) & 0x7f;
    if (controller < 0 || controller > 9) {
        console.error("Unknown MUS controller " + controller);
        return null;
    }
    var value = context.file.readUInt8(context.offset++) & 0x7f;
    var delay = readDelay_1.readDelay(context, byte.last);
    if (controller === MusControllerType_1.MusControllerType.Volume) {
        context.channels[byte.channel] = { volume: value };
    }
    return {
        delay: delay,
        type: byte.type,
        channel: byte.channel,
        controller: controller,
        value: value
    };
};
exports.readController = readController;
