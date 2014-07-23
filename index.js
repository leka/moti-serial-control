

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


var serialport = require("serialport"),				// include the serialport library
	SerialPort  = serialport.SerialPort,			// make a local instance of serial
	app = require('express')(),						// start Express framework
	server = require('http').createServer(app),		// start an HTTP server
	io = require('socket.io').listen(server);		// filter the server using socket.io


var portName = process.argv[2];						// third word of the command line should be serial port name
console.log("opening serial port: " + portName);	// print out the port you're listening on


server.listen(8080);								// listen for incoming requests on the server
console.log("Listening for new clients on port 8080");

var myPort;
var myBTPort = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var portType = '';


// respond to web GET requests with the index.html page:
app.get('/', function (request, response) {
	response.sendfile(__dirname + '/index.html');
});


// listen for new socket.io connections:
io.sockets.on('connection', function (socket) {
	socket.on('downEvent', function(keyCode) {
		console.log(keyCode);

		switch (keyCode) {
			case 37:
				console.log('Left');
				sendData(dataSpin(0, 255, 160));
				break;

			case 38:
				console.log('Forward');
				sendData(dataGo(1, 255, 0));
				break;

			case 39:
				console.log('Right');
				sendData(dataSpin(1, 255, 160));
				break;

			case 40:
				console.log('Backward');
				sendData(dataGo(0, 255, 0));
				break;

			default:
				break;
		}
	});

	socket.on('upEvent', function (keyCode) {
		console.log('Up');

		sendData(dataStop());
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

	socket.on('listBluetoothPorts', function () {
		console.log("Searching for Bluetooth devices...");

		myBTPort.inquire();
	});

	socket.on('bluetoothConnect', function(address) {
		portType = 'Bluetooth';

		console.log('Connecting to Bluetooth...');

		myBTPort.findSerialPortChannel(address, function(channel) {
			myBTPort.connect(address, channel, function() {
				console.log('Bluetooth connected... ' + myBTPort);
			});
		});
	});
});
