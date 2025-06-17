"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mus2midi = void 0;
var mid_1 = require("./mid");
var mus_1 = require("./mus");
var mus2midi = function (mus) { return mid_1.writeMid(mus_1.readMus(mus)); };
exports.mus2midi = mus2midi;
