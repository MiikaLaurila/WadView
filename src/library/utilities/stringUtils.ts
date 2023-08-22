export const utf8ArrayToStr = (function () {
    const charCache = new Array(128); // Preallocate the cache for the common single byte chars
    const charFromCodePt = String.fromCodePoint || String.fromCharCode;
    const result: string[] = [];

    return function (originalArray: Uint8Array) {
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

//prettier-ignore
export const cp347toUtf8 = [
    '␀', '␁', '␂', '␃', '␄', '␅', '␆', '␇', '␈', '␉', '␊',
    '␋', '␌', '␍', '␎', '␏', '␐', '␑', '␒', '␓', '␔', '␕',
    '␖', '␗', '␘', '␙', '␚', '␛', '␜', '␝', '␞', '␟', ' ',
    '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',',
    '-', '.', '/', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    ':', ';', '<', '=', '>', '?', '@', 'A', 'B', 'C', 'D', 'E',
    'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_',
    '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
    'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y',
    'z', '{', '|', '}', '~', '␡', 'Ç', 'ü', 'é', 'â', 'ä', 'à', 'å',
    'ç', 'ê', 'ë', 'è', 'ï', 'î', 'ì', 'Ä', 'Å', 'É', 'æ', 'Æ', 'ô',
    'ö', 'ò', 'û', 'ù', 'ÿ', 'Ö', 'Ü', '¢', '£', '¥', '₧', 'ƒ', 'á',
    'í', 'ó', 'ú', 'ñ', 'Ñ', 'ª', 'º', '¿', '⌐', '¬', '½', '¼', '¡',
    '«', '»', '░', '▒', '▓', '│', '┤', '╡', '╢', '╖', '╕', '╣', '║',
    '╗', '╝', '╜', '╛', '┐', '└', '┴', '┬', '├', '─', '┼', '╞', '╟',
    '╚', '╔', '╩', '╦', '╠', '═', '╬', '╧', '╨', '╤', '╥', '╙', '╘',
    '╒', '╓', '╫', '╪', '┘', '┌', '█', '▄', '▌', '▐', '▀', 'α', 'ß',
    'Γ', 'π', 'Σ', 'σ', 'µ', 'τ', 'Φ', 'Θ', 'Ω', 'δ', '∞', 'φ', 'ε',
    '∩', '≡', '±', '≥', '≤', '⌠', '⌡', '÷', '≈', '°', '∙', '·', '√',
    'ⁿ', '²', '■', ' '
];
