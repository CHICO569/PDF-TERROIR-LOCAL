#!/bin/bash

# Compile IDL to generate Python stubs in the correct location
omniidl -bpython -I/app/idl -C/app /app/idl/ConversionService.idl

# Verify that the stubs were generated
echo "Generated stubs:"
ls -la /app/*.py | grep -i conversion || echo "No conversion files found"

# Clean previous NameService data files that can block restart
rm -f /tmp/omninames-* /tmp/omninames-*.bak

# Start NameService in the background on port 2809
echo "Starting omniNames on port 2809..."
omniNames -start 2809 -logdir /tmp &
NAMES_PID=$!
sleep 2

# Start the CORBA Server in the background
echo "Starting CORBA Conversion Server..."
python3 /app/corba_server.py -ORBInitRef NameService=corbaloc::localhost:2809/NameService &
SERVER_PID=$!
sleep 2

echo "CORBA server started with PID $SERVER_PID"
echo "NameService started with PID $NAMES_PID"

# Start the Flask API Gateway in the foreground
echo "Starting Flask API Gateway..."
python3 /app/api_gateway.py -ORBInitRef NameService=corbaloc::localhost:2809/NameService
