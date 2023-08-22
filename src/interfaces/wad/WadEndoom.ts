export const ANSIColors = [
    '#000000',
    '#0000aa',
    '#00aa00',
    '#00aaaa',
    '#aa0000',
    '#aa00aa',
    '#aa5500',
    '#aaaaaa',
    '#555555',
    '#5555ff',
    '#55ff55',
    '#55ffff',
    '#ff5555',
    '#ff55ff',
    '#ffff55',
    '#ffffff',
] as const;

type ANSIColor = (typeof ANSIColors)[number];

export type WadEndoomChar = {
    char: string;
    backgroundColor: ANSIColor;
    foregroundColor: ANSIColor;
    blink: boolean;
};
export type WadEndoom = WadEndoomChar[];
