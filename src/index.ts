// Node modules.
import { HID, Device, devices as findDevices } from 'node-hid';
import { InputReport0x3f, InputReport0x21, InputReport0x30, InputReport } from './models/';
// Local modules.
import { IDeviceInfo } from './models/subcommand';
import * as PacketParser from './utils/packet-parser';
import * as SubcommandSender from './utils/subcommand-sender';

let isNintendoDevice = (device: Device) => {
    return device.vendorId === 0x057e;
}

let isLeftJoyCon = (device: Device) => {
    return isNintendoDevice(device) && device.productId === 0x2006;
};

let isRightJoyCon = (device: Device) => {
    return isNintendoDevice(device) && device.productId === 0x2007;
};

function getType(device: Device) {
    let product = device.product ?? "";
    switch (true) {
        case /Pro Controller/i.test(product):
            return 'pro-controller';
        case /Joy-Con \([LR]\)/i.test(product):
            return 'joy-con';
        // On windows, the product name shows up as "Wireless Device"
        // so we need to check the product ID instead.
        case isLeftJoyCon(device) || isRightJoyCon(device):
            return 'joy-con';
        default:
            return 'unknown';
    }
}

class NsSwitchHID {
    private vendorId: number;
    private productId: number;
    private serialNumber?: string;
    private product?: string;
    private type: 'joy-con' | 'pro-controller' | 'unknown';
    private path?: string;
    private usage?: number;
    private hid: HID;
    private listeners: Array<(packet: InputReport) => void> = [];

    constructor(device: Device) {
        this.vendorId = device.vendorId;
        this.productId = device.productId;
        this.serialNumber = device.serialNumber;
        this.product = device.product;
        this.type = getType(device);
        this.path = device.path;
        this.usage = device.usage;
        this.hid = new HID(device.vendorId, device.productId);
        // System handler.
        if (this.type === 'joy-con') {
            this.activateJoyConStream();
        }
    }

    public get meta() {
        return {
            vendorId: this.vendorId,
            productId: this.productId,
            serialNumber: this.serialNumber,
            product: this.product,
            type: this.type,
            path: this.path,
            usage: this.usage,
        };
    }

    /**
     * Add / remove a handler to recevice packets when device send streaming data.
     */
    public manageHandler(action: 'add' | 'remove', callback: (packet: InputReport) => void) {
        if (action === 'add') {
            this.listeners.push(callback);
        } else {
            this.listeners = this.listeners.filter((listener) => listener !== callback);
        }
    }

    /**
     * Request device info to Jon-Con.
     */
    public async requestDeviceInfo() {
        if (this.type === 'joy-con') {
            const manageHandler = this.manageHandler.bind(this);
            const deviceInfo: IDeviceInfo = await SubcommandSender.requestDeviceInfo(this.hid, manageHandler);

            return deviceInfo;
        }
    }

    /**
     * Enable IMU data will make Jon-Con sends **Input Report 0x30**.
     */
    public async enableIMU() {
        if (this.type === 'joy-con') {
            await SubcommandSender.enableIMU(this.hid, this.manageHandler.bind(this), true);
            await SubcommandSender.setInputReportMode(this.hid, this.manageHandler.bind(this), 'standard-full-mode');

            console.info(`Device ${this.product} (${this.serialNumber}) enabled IMU.`);
        }
    }

    /**
     * Disable IMU data will cancel Jon-Con to send **Input Report 0x30**.
     */
    public async disableIMU() {
        if (this.type === 'joy-con') {
            await SubcommandSender.enableIMU(this.hid, this.manageHandler.bind(this), false);
            await SubcommandSender.setInputReportMode(this.hid, this.manageHandler.bind(this), 'simple-hid-mode');

            console.info(`Device ${this.product} (${this.serialNumber}) disabled IMU.`);
        }
    }

    /**
     * Enable Jon-Con's vibration.
     */
    public async enableVibration() {
        if (this.type === 'joy-con') {
            await SubcommandSender.enableVibration(this.hid, this.manageHandler.bind(this), true);

            console.info(`Device ${this.product} (${this.serialNumber}) enabled vibration.`);
        }
    }

    /**
     * Disable Jon-Con's vibration.
     */
    public async disableVibration() {
        if (this.type === 'joy-con') {
            await SubcommandSender.enableVibration(this.hid, this.manageHandler.bind(this), false);

            console.info(`Device ${this.product} (${this.serialNumber}) disabled vibration.`);
        }
    }

    private async activateJoyConStream() {
        this.hid.on('data', (rawData: Buffer) => {
            const data = rawData.toString('hex').match(/.{2}/g);

            if (!data) { return; }

            const inputReportID = parseInt(data[0], 16);

            let packet: Partial<InputReport> = {
                inputReportID: PacketParser.parseInputReportID(rawData, data),
            };

            switch (inputReportID) {
                case 0x3f: {
                    packet = {
                        ...packet,
                        buttonStatus: PacketParser.parseButtonStatus(rawData, data),
                        analogStick: PacketParser.parseAnalogStick(rawData, data),
                        filter: PacketParser.parseFilter(rawData, data),
                    } as InputReport0x3f;
                    break;
                }
                case 0x21:
                case 0x30: {
                    packet = {
                        ...packet,
                        timer: PacketParser.parseTimer(rawData, data),
                        batteryLevel: PacketParser.parseBatteryLevel(rawData, data),
                        connectionInfo: PacketParser.parseConnectionInfo(rawData, data),
                        buttonStatus: PacketParser.parseCompleteButtonStatus(rawData, data),
                        analogStickLeft: PacketParser.parseAnalogStickLeft(rawData, data),
                        analogStickRight: PacketParser.parseAnalogStickRight(rawData, data),
                        vibrator: PacketParser.parseVibrator(rawData, data),
                    };

                    if (inputReportID === 0x21) {
                        packet = {
                            ...packet,
                            ack: PacketParser.parseAck(rawData, data),
                            subcommandID: PacketParser.parseSubcommandID(rawData, data),
                            subcommandReplyData: PacketParser.parseSubcommandReplyData(rawData, data),
                        } as InputReport0x21;
                    }

                    if (inputReportID === 0x30) {
                        const accelerometers = PacketParser.parseAccelerometers(rawData, data);
                        const gyroscopes = PacketParser.parseGyroscopes(rawData, data);

                        packet = {
                            ...packet,
                            accelerometers,
                            gyroscopes,
                            actualAccelerometer: {
                                acc: PacketParser.calculateActualAccelerometer(accelerometers.map(a => [a.x.acc, a.y.acc, a.z.acc])),
                            },
                            actualGyroscope: {
                                dps: PacketParser.calculateActualGyroscope(gyroscopes.map(g => g.map(v => v.dps))),
                                rps: PacketParser.calculateActualGyroscope(gyroscopes.map(g => g.map(v => v.rps))),
                            },
                        } as InputReport0x30;
                    }
                    break;
                }
            }

            // Broadcast.
            this.listeners.forEach((listener) => listener(packet as InputReport));
        });

        this.hid.on('error', (error) => {
            console.warn({
                ...this.meta,
                error,
            });
        });
    }
}

export function findControllers(callback: (controllers: NsSwitchHID[]) => void) {
    var devices: NsSwitchHID[] = [];
    var devicesIds = new Set();
    findDevices().forEach(d => {
        var deviceId = `${d.vendorId}:${d.productId}`;
        if (getType(d) !== 'unknown' && isNintendoDevice(d) && !devicesIds.has(deviceId)) {
            devices.push(new NsSwitchHID(d));
            devicesIds.add(deviceId);
        }
    }, [] as NsSwitchHID[]);

    callback(devices);
}
