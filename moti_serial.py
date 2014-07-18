#-*- coding: utf8

import serial
import bluetooth
from sys import platform
from flask import Flask, render_template, request, jsonify


app = Flask(__name__)
app.secret_key = '\x82\xea\xf7\x16N\xfa\x84E:\x06H\x9b\xb0\xc7\xaas"\x18Z\x1f\xff\xc5\xf0\x89'

global_port = None


def moti_send_data(data):
    global_port.send(''.join([chr(c) for c in data]))
    print 'Data sent!'


def moti_send_go(direction, speed, duration):
    data = [42, 0, direction, speed, duration >> 8, duration & 255]
    moti_send_data(data)


def moti_send_spin(rotation, speed, angle):
    data = [42, 1, rotation, speed, angle >> 8, angle & 255]
    moti_send_data(data)


def moti_send_stop():
    data = [42, 2]
    moti_send_data(data)


def moti_send_fade(led, start_red, start_green, start_blue, end_red, end_green, end_blue, duration):
    data = [42, 3, led, start_red, start_green, start_blue,
            end_red, end_green, end_blue, duration >> 8, duration & 255]
    moti_send_data(data)


def get_ports():
    if not platform.startswith('win'):
        from glob import glob
        return glob('/dev/ttyACM*') + glob('/dev/tty.usbmodem*')

    return []

@app.route('/connect')
def connect():
    global global_port

    # port = request.args.get('port', '/dev/ttyACM0')
    # baudrate = request.args.get('baudrate', 115200)

    if global_port is not None:
        global_port.close()

    try:
        global_port = bluetooth.BluetoothSocket(bluetooth.RFCOMM)  # serial.Serial(port=port, baudrate=baudrate, timeout=3.0)
        global_port.connect(('20:13:06:14:34:01', 1))
        print 'Connected!'
        return jsonify(result=True)
    except Exception as e:
        print 'Not connected!', e
        return jsonify(result=False)


@app.route('/disconnect')
def disconnect():
    global global_port

    if global_port is not None:
        global_port.close()
        global_port = None

    return jsonify()


@app.route('/go')
def go():
    direction = request.args.get('direction', 1, type=int)
    speed = request.args.get('speed', 0, type=int)
    duration = request.args.get('duration', 0, type=int)

    try:
        moti_send_go(direction, speed, duration)
        return jsonify(result=True)
    except Exception as e:
        print e
        return jsonify(result=False)


@app.route('/spin')
def spin():
    rotation = request.args.get('rotation', 0, type=int)
    speed = request.args.get('speed', 0, type=int)
    angle = request.args.get('angle', 0, type=int)

    try:
        moti_send_spin(rotation, speed, angle)
        return jsonify(result=True)
    except Exception as e:
        print e
        return jsonify(result=False)


@app.route('/stop')
def stop():
    try:
        moti_send_stop()
        return jsonify(result=True)
    except Exception as e:
        print e
        return jsonify(result=False)


@app.route('/fade')
def fade():
    led = request.args.get('led', 0, type=int)
    start_red = request.args.get('start_red', 0, type=int)
    start_green = request.args.get('start_green', 0, type=int)
    start_blue = request.args.get('start_blue', 0, type=int)
    end_red = request.args.get('end_red', 0, type=int)
    end_green = request.args.get('end_green', 0, type=int)
    end_blue = request.args.get('end_blue', 0, type=int)
    duration = request.args.get('duration', 0, type=int)

    try:
        moti_send_fade(led, start_red, start_green, start_blue, end_red, end_green, end_blue, duration)
        return jsonify(result=True)
    except Exception as e:
        print e
        return jsonify(result=False)


@app.route('/')
def moti():
    ports = get_ports() + ['Bluetooth']
    baudrates = reversed(['300', '1200', '2400', '4800', '9600', '14400', '19200', '28800', '38400', '57600', '115200'])
    return render_template('moti.html', ports=ports, baudrates=baudrates)


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int('8000'),
        debug=True
    )
