// Local modules.
import * as JoyCon from './index';
import * as readline from 'readline';
import { InputReport0x30 } from './models';
import * as dgram from 'dgram';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const udpClient = dgram.createSocket('udp4');
const udpPort = 12345; // Replace with your desired UDP port
const udpHost = 'localhost'; // Replace with your desired UDP host

JoyCon.findControllers((devices) => {
    console.log(`Found ${devices.length} Joy-cons`);
    devices.forEach(async (device) => {
        console.log(`Found a device (${device.meta.serialNumber})`);
        console.log(device.meta);

        await device.enableIMU();
        await device.enableVibration();
        // Add a handler for new device.
        device.manageHandler('add', packet => {
            let packet0x30 = packet as InputReport0x30;
            let data = {
                id: device.meta.product,
                batteryLevel: packet0x30.batteryLevel.level,
                gyroscope: packet0x30.actualGyroscope,
                accelerometer: packet0x30.actualAccelerometer,
            };
            // console.log(device.meta.product, (packet as InputReport0x30).gyroscopes);
            const message = Buffer.from(JSON.stringify(data));
            udpClient.send(message, udpPort, udpHost);
        });

        // const deviceInfo = await device.requestDeviceInfo();
        // await device.disableIMU();
        // await device.enableVibration();
        // await new Promise(resolve => setTimeout(resolve, 200));
        // await device.disableVibration();
    });
});

rl.question('Press Enter to exit...', () => {
    rl.close();
    process.exit(0);
});
