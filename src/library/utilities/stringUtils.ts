export const utf8ArrayToStr = (function() {
    const charCache = new Array(128); // Preallocate the cache for the common single byte chars
    const charFromCodePt = String.fromCodePoint || String.fromCharCode;
    const result: string[] = [];

    return function(originalArray: Uint8Array) {
        const zeroIndex = originalArray.indexOf(0);
        let array: Uint8Array = new Uint8Array();
        if (zeroIndex >= 0) {
            const terminated = originalArray.slice(0, zeroIndex);
            array = terminated;
        } else {
            array = originalArray;
        }
        let codePt, byte1;
        const buffLen = array.length;

        result.length = 0;

        // eslint-disable-next-line space-in-parens
        for (let i = 0; i < buffLen; ) {
            byte1 = array[i++];

            if (byte1 <= 0x7f) {
                codePt = byte1;
            } else if (byte1 <= 0xdf) {
                codePt = ((byte1 & 0x1f) << 6) | (array[i++] & 0x3f);
            } else if (byte1 <= 0xef) {
                codePt = ((byte1 & 0x0f) << 12) | ((array[i++] & 0x3f) << 6) | (array[i++] & 0x3f);
            } else {
                codePt =
                    ((byte1 & 0x07) << 18) |
                    ((array[i++] & 0x3f) << 12) |
                    ((array[i++] & 0x3f) << 6) |
                    (array[i++] & 0x3f);
            }

            result.push(charCache[codePt] || (charCache[codePt] = charFromCodePt(codePt)));
        }

        return result.join('');
    };
})();
