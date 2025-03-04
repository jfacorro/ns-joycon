type PacketBuffer = {
    _raw: Buffer;
    _hex: String | String[];
};
export type BatteryLevelValues = 'full' | 'medium' | 'low' | 'critical' | 'empty' | 'charging';
type BatteryLevel = PacketBuffer & {
    level: BatteryLevelValues;
};
type ButtonStatus = PacketBuffer & {
    y: Boolean;
    x: Boolean;
    b: Boolean;
    a: Boolean;
    r: Boolean;
    zr: Boolean;
    down: Boolean;
    up: Boolean;
    right: Boolean;
    left: Boolean;
    l: Boolean;
    zl: Boolean;
    sr: Boolean;
    sl: Boolean;
    minus: Boolean;
    plus: Boolean;
    rightStick: Boolean;
    leftStick: Boolean;
    home: Boolean;
    caputure: Boolean;
    chargingGrip: Boolean;
};
type AnalogStick = PacketBuffer & {
    horizontal: number;
    vertical: number;
};
type StandardInputReport = {
    inputReportID: PacketBuffer;
    timer: PacketBuffer;
    batteryLevel: BatteryLevel;
    connectionInfo: PacketBuffer;
    buttonStatus: ButtonStatus;
    analogStickLeft: AnalogStick;
    analogStickRight: AnalogStick;
    vibrator: PacketBuffer;
};
export type Accelerometer = {
    x: PacketBuffer & {
        acc: number;
    };
    y: PacketBuffer & {
        acc: number;
    };
    z: PacketBuffer & {
        acc: number;
    };
};
export type Gyroscope = Array<PacketBuffer & {
    dps: number;
    rps: number;
}>;
export type InputReport0x21 = StandardInputReport & {
    ack: PacketBuffer;
    subcommandID: PacketBuffer;
    subcommandReplyData: PacketBuffer;
};
export type InputReport0x30 = StandardInputReport & {
    accelerometers: Accelerometer[];
    gyroscopes: Gyroscope[];
    actualAccelerometer: {
        acc: {
            x: number;
            y: number;
            z: number;
        };
    };
    actualGyroscope: {
        dps: number[];
        rps: number[];
    };
};
export type InputReport0x3f = {
    inputReportID: PacketBuffer;
    buttonStatus: PacketBuffer;
    analogStick: PacketBuffer;
    filter: PacketBuffer;
};
export type InputReport = InputReport0x3f | InputReport0x21 | InputReport0x30;
export {};
