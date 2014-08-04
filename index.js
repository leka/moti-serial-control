// 20:13:06:13:14:75
// 20:13:06:14:34:01

function error_callback(err, bytesWritten){
	if (err)
		console.log(err);
}


function sendData(data) {
	var data_string = "";

	data.map(function(item) {
		data_string += String.fromCharCode(item);
	});
	
	if (portType == 'USB')
		myPort.write(data_string);
	else if (portType == 'Bluetooth')
		myBTPort.write(new Buffer(data_string, 'utf-8'), error_callback);
	else
		console.log("Error, cannot send data: not connected.");
}


function dataGo(direction, speed, duration) {
	return [42, 0, direction, speed, duration >> 8, duration & 255];
}


function dataSpin(rotation, speed, angle) {
	return [42, 1, rotation, speed, angle >> 8, angle & 255];
}


function dataStop() {
	return [42, 2];
}


var serialport = require("serialport"),
	SerialPort  = serialport.SerialPort,
	app = require('express')(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	fs = require('fs');

server.listen(8080);
console.log("Listening for new clients on port 8080");

var myPort;
var myBTPort = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var portType = '';

var dataStream = fs.createWriteStream('moti_data');

var lastPress = 0;
var lastKey = 0;


app.get('/', function (request, response) {
	response.sendfile(__dirname + '/index.html');
});


io.sockets.on('connection', function (socket) {
	socket.on('downEvent', function(keyCode) {
		if ((lastKey == keyCode) && (lastPress + 1000 > Date.now()))
			return;

		lastKey = keyCode;
		lastPress = Date.now();

		if (portType) {
			console.log(keyCode);

			switch (keyCode) {
				case 37:
					console.log('Left');
					sendData(dataSpin(0, 105, 160));
					break;

				case 38:
					console.log('Forward');
					sendData(dataGo(1, 105, 5000));
					break;

				case 39:
					console.log('Right');
					sendData(dataSpin(1, 105, 160));
					break;

				case 40:
					console.log('Backward');
					sendData(dataGo(0, 105, 5000));
					break;

				default:
					break;
			}
		}
	});

	socket.on('upEvent', function (keyCode) {
		if (portType) {
			console.log('Up');

			lastKey = 0;
			lastPress = 0;

			sendData(dataStop());
		}
	});

	socket.on('listUSBPorts', function () {
		serialport.list(function (err, ports) {
			var output_ports = [];
			
			ports.forEach(function(port) {
				console.log(port.comName + ' -- ' + port.pnpId);
				output_ports.push(port.comName);
			});

			console.log(output_ports);
			socket.emit('usbPortsListed', output_ports);
		});
	});

	socket.on('usbConnect', function(port) {
		if (!port) {
			console.log('lolnope.');
			return;
		}

		socket.emit('disconnectDevice');
		while (portType);

		console.log('Connecting...');

		/* TODO: Handle exceptions */

		myPort = new SerialPort(port, {
			baudrate: 115200,
			parser: serialport.parsers.readline("\r\n")
		});

		portType = 'USB';

		console.log('USB connected. ' + myPort);
	});

	myBTPort.on('found', function (address, name) {
		console.log('Bluetooth device found: ' + name + ' (' + address + ')');

		socket.emit('bluetoothDeviceFound', {address: address, name: name});
	});

	myBTPort.on('data', function(data) {
		dataStream.write(data);
	});

	socket.on('listBluetoothPorts', function () {
		console.log("Searching for Bluetooth devices...");

		myBTPort.inquire();
	});

	socket.on('bluetoothConnect', function(address) {
		if (!address) {
			console.log('lolnope.');
			return;
		}

		socket.emit('disconnectDevice');
		while (portType);

		portType = 'Bluetooth';

		console.log('Connecting to Bluetooth...');

		myBTPort.findSerialPortChannel(address, function(channel) {
			myBTPort.connect(address, channel, function() {
				console.log('Bluetooth connected... ' + myBTPort);
			});
		});
	});

	socket.on('disconnectDevice', function () {
		if (portType == 'USB')
			myPort.close();
		else if (portType == 'Bluetooth')
			myBTPort.close();

		if (portType)
			console.log('Disconnected.');

		portType = '';
	});

	socket.on('toggleMode', function() {
		sendData([1]);
	});
});
