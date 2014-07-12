#-*- coding: utf8

import serial
from sys import argv


# Ugly, but works :°


baudrate = int(argv[2]) if len(argv) == 3 else 115200
port = serial.Serial(port=argv[1], baudrate=baudrate, timeout=3.0)

data = [42]

action = input('GO: 1\nSPIN: 2\nSTOP: 3\nFADE 4\n')

data.append(action - 1)

if action == 1:
    direction = input('Direction: (1 forward, 0 backward)\n')
    speed = input('Speed: (0-255)\n')
    duration = input('Duration: (0-65535)\n')

    data.append(direction)
    data.append(speed)
    data.append(duration >> 8)
    data.append(duration & 255)

elif action == 2:
    rotation = input('rotation: (1 right, 0 left)\n')
    speed = input('Speed: (0-255)\n')
    angle = input('Angle: (degrees, >= 0)\n')

    data.append(rotation)
    data.append(speed)
    data.append(angle >> 8)
    data.append(angle & 255)

elif action == 3:
    pass

elif action == 4:
    indicator = input('Led: (0 for HEART) ')
    start_r = input('Start color R ')
    start_g = input('Start color G ')
    start_b = input('Start color B ')
    end_r = input('End color R ')
    end_g = input('End color G ')
    end_b = input('End color B ')
    duration = input('Duration: (0-65535) ')

    data.append(indicator)
    data.append(start_r)
    data.append(start_g)
    data.append(start_b)
    data.append(end_r)
    data.append(end_g)
    data.append(end_b)
    data.append(duration >> 8)
    data.append(duration & 255)

port.write(''.join([chr(c) for c in data]))
port.close()

print data

print 'Data sent!'
