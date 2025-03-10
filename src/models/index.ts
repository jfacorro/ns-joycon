type PacketBuffer = {
    _raw: Buffer;
    _hex: String | String[];
};

export type BatteryLevelValues = 'full' | 'medium' | 'low' | 'critical' | 'empty' | 'charging';

type BatteryLevel = PacketBuffer & {
    level: BatteryLevelValues;
};

type ButtonStatus = PacketBuffer & {
    // Byte 3 (Right Joy-Con)
    y: Boolean;
    x: Boolean;
    b: Boolean;
    a: Boolean;
    r: Boolean;
    zr: Boolean;
    // Byte 5 (Left Joy-Con)
    down: Boolean;
    up: Boolean;
    right: Boolean;
    left: Boolean;
    l: Boolean;
    zl: Boolean;
    // Byte 3,5 (Shared)
    sr: Boolean;
    sl: Boolean;
    // Byte 4 (Shared)
    minus: Boolean;
    plus: Boolean;
    rightStick: Boolean;
    leftStick: Boolean;
    home: Boolean;
    caputure: Boolean;
    chargingGrip: Boolean;
}

type AnalogStick = PacketBuffer & {
    horizontal: number;
    vertical: number;
}

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
    x: PacketBuffer & { acc: number };
    y: PacketBuffer & { acc: number };
    z: PacketBuffer & { acc: number };
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
        dps: {
            x: number;
            y: number;
            z: number;
        };
        rps: {
            x: number;
            y: number;
            z: number;
        };
    };
};

export type InputReport0x3f = {
    inputReportID: PacketBuffer;
    buttonStatus: PacketBuffer;
    analogStick: PacketBuffer;
    filter: PacketBuffer;
};

export type InputReport = InputReport0x3f | InputReport0x21 | InputReport0x30;
