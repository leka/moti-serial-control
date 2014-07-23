

function error_callback(err, bytesWritten){
	if (err)
		console.log(err);
}


function sendData(data, port) {
	var data_string = "";

	data.map(function(item) {
		data_string += String.fromCharCode(item);
	});
	
	port.write(new Buffer(data_string, 'utf-8'), error_callback);
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


// open the serial port. Change the name to the name of your port, just like in Processing and Arduino:
var myPort = new SerialPort(portName,
	{
		baudrate: 115200,
		// look for return and newline at the end of each data packet:
		parser: serialport.parsers.readline("\r\n")
	}
);


var myBtPort = new (require('bluetooth-serial-port')).BluetoothSerialPort();
myBtPort.on('found', function (address, name) {
	console.log('Found: ' + address + ' with name ' + name);
	if (name.indexOf('moti') != -1) {
		myBtPort.findSerialPortChannel(address, function(channel) {
			console.log('Found RFCOMM channel for serial port on ' + name + ': ' + channel);

			console.log('Attempting to connect to moti...');

			myBtPort.connect(address, channel, function(){
				console.log('Connected. Receiving data...');
			});
		});

		console.log("Closing port");
		myBtPort.close();
	}
});

myBtPort.inquire();



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
				sendData(dataSpin(0, 255, 160), myBtPort);
				break;

			case 38:
				console.log('Forward');
				sendData(dataGo(1, 255, 0), myBtPort);
				break;

			case 39:
				console.log('Right');
				sendData(dataSpin(1, 255, 160), myBtPort);
				break;

			case 40:
				console.log('Backward');
				sendData(dataGo(0, 255, 0), myBtPort);
				break;

			default:
				break;
		}
	});

	socket.on('upEvent', function (keyCode) {
		console.log('Up');

		sendData(dataStop(), myBtPort);
	});

	// listen for new serial data:  
	myPort.on('data', function (data) {
		console.log("Data: " + data);
		// Convert the string into a JSON object:
		// var serialData = JSON.parse(data);
		// for debugging, you should see this in the terminal window:
		// console.log(data);
		// send a serial event to the web client with the data:
		// socket.emit('serialEvent', serialData);
	});
});
