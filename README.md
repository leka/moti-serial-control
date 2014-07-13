# Moti Serial Control

Tool that allows one to control Moti via a Flask application

## Install

You need to have a python-2.7, with the pip tool installed

Then, to install, just run (cleaner in a virtualenv :-)):

    pip install -r requirements.txt

It will install the two modules needed by the application: Flask
and pySerial (to speak with the device)

## Use

Quite straightforward, just run:

    python moti_serial.py

Then, open your favorite browser and go to the address *localhost:8000*

You're done, it's pretty easy to use a web application, with a basic UI for now :')
