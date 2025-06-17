"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.write8 = exports.write16 = exports.write32 = void 0;
var Buffer = require('buffer/').Buffer;
var Constants_1 = require("../interfaces/Constants");
var write32 = function (context, data) {
    var buffer = Buffer.alloc(Constants_1.Uint32Size);
    buffer.writeUInt32BE(data);
    context.file.write(buffer);
    context.offset += Constants_1.Uint32Size;
};
exports.write32 = write32;
var write16 = function (context, data) {
    var buffer = Buffer.alloc(Constants_1.Uint16Size);
    buffer.writeUInt16BE(data);
    context.file.write(buffer);
    context.offset += Constants_1.Uint16Size;
};
exports.write16 = write16;
var write8 = function (context, data) {
    var buffer = Buffer.alloc(Constants_1.Uint8Size);
    buffer.writeUInt8(data);
    context.file.write(buffer);
    context.offset += Constants_1.Uint8Size;
};
exports.write8 = write8;
