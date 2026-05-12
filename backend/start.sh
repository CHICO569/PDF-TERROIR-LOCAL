#!/bin/bash

# Compile IDL to generate Python stubs
omniidl -bpython -I/app/idl /app/idl/ConversionService.idl

# Start NameService in the background on port 2809
omniNames -start 2809 &
sleep 2

# Start the CORBA Server in the background
# -ORBInitRef NameService=corbaloc::localhost:2809/NameService
python3 /app/corba_server.py -ORBInitRef NameService=corbaloc::localhost:2809/NameService &
sleep 2

# Start the Flask API Gateway in the foreground
python3 /app/api_gateway.py -ORBInitRef NameService=corbaloc::localhost:2809/NameService
