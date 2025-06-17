"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.peekEventType = void 0;
var peekEventType = function (_a) {
    var file = _a.file, offset = _a.offset;
    return (file.readUInt8(offset) & 0x70) >> 4;
};
exports.peekEventType = peekEventType;
