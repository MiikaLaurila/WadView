export declare enum MusEventType {
    ReleaseNote = 0,
    PlayNote = 1,
    PitchBend = 2,
    SystemEvent = 3,
    Controller = 4,
    EndOfMeasure = 5,
    Finish = 6,
    Unused = 7
}
export default interface MusEvent {
    delay: number;
    type: MusEventType;
    channel: number;
}
