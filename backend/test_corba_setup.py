#!/usr/bin/env python3
"""
Script to test CORBA/IDL setup and verify all modules are correctly configured.
Run this BEFORE starting the containers to verify everything is working.
"""

import sys
import os

print("=" * 60)
print("CORBA/IDL Configuration Test")
print("=" * 60)

# Test 1: Check Python version
print("\n✓ Test 1: Python Version")
print(f"  Python: {sys.version}")
print(f"  Executable: {sys.executable}")

# Test 2: Check current directory
print("\n✓ Test 2: Working Directory")
current_dir = os.getcwd()
print(f"  Current dir: {current_dir}")

# Test 3: Check omniORB installation
print("\n✓ Test 3: omniORB Installation")
try:
    import omniORB
    print(f"  omniORB imported successfully")
    print(f"  omniORB version: {omniORB.__version__ if hasattr(omniORB, '__version__') else 'unknown'}")
except ImportError as e:
    print(f"  ✗ ERROR: Failed to import omniORB: {e}")
    sys.exit(1)

# Test 4: Check CosNaming
print("\n✓ Test 4: CosNaming Module")
try:
    import CosNaming
    print(f"  CosNaming imported successfully")
except ImportError as e:
    print(f"  ✗ ERROR: Failed to import CosNaming: {e}")
    sys.exit(1)

# Test 5: Check ConversionService_idl stub
print("\n✓ Test 5: ConversionService_idl Stub")
try:
    import ConversionService_idl
    print(f"  ConversionService_idl imported successfully")
    print(f"  Module path: {ConversionService_idl.__file__}")
except ImportError as e:
    print(f"  ✗ ERROR: Failed to import ConversionService_idl: {e}")
    print(f"  Python path: {sys.path}")
    sys.exit(1)

# Test 6: Check pdfservice module
print("\n✓ Test 6: pdfservice Module")
try:
    import pdfservice
    print(f"  pdfservice imported successfully")
    print(f"  Module path: {pdfservice.__file__}")
except ImportError as e:
    print(f"  ✗ ERROR: Failed to import pdfservice: {e}")
    sys.exit(1)

# Test 7: Check pdfservice__POA module
print("\n✓ Test 7: pdfservice__POA Module")
try:
    import pdfservice__POA
    print(f"  pdfservice__POA imported successfully")
    print(f"  Module path: {pdfservice__POA.__file__}")
except ImportError as e:
    print(f"  ✗ ERROR: Failed to import pdfservice__POA: {e}")
    sys.exit(1)

# Test 8: Check Conversion interface
print("\n✓ Test 8: Conversion Interface")
try:
    conversion_interface = pdfservice.Conversion
    print(f"  pdfservice.Conversion interface exists")
    print(f"  Interface type: {type(conversion_interface)}")
except AttributeError as e:
    print(f"  ✗ ERROR: Failed to access pdfservice.Conversion: {e}")
    sys.exit(1)

# Test 9: Check ConversionImpl POA
print("\n✓ Test 9: ConversionImpl POA")
try:
    conversion_impl_poa = pdfservice__POA.Conversion
    print(f"  pdfservice__POA.Conversion POA exists")
    print(f"  POA type: {type(conversion_impl_poa)}")
except AttributeError as e:
    print(f"  ✗ ERROR: Failed to access pdfservice__POA.Conversion: {e}")
    sys.exit(1)

# Test 10: Check ProtectionOptions struct
print("\n✓ Test 10: ProtectionOptions Struct")
try:
    protection_opts = pdfservice.ProtectionOptions(
        password="test",
        noCopy=True,
        noPrint=False,
        noEdit=True,
        noAnnotate=False
    )
    print(f"  pdfservice.ProtectionOptions struct created successfully")
    print(f"  password: {protection_opts.password}")
    print(f"  noCopy: {protection_opts.noCopy}")
    print(f"  noPrint: {protection_opts.noPrint}")
    print(f"  noEdit: {protection_opts.noEdit}")
    print(f"  noAnnotate: {protection_opts.noAnnotate}")
except Exception as e:
    print(f"  ✗ ERROR: Failed to create ProtectionOptions: {e}")
    sys.exit(1)

# Test 11: Check other required dependencies
print("\n✓ Test 11: Required Dependencies")
required_deps = {
    'Flask': 'flask',
    'flask_cors': 'flask_cors',
    'pypdf': 'pypdf',
    'pdf2docx': 'pdf2docx',
    'pytesseract': 'pytesseract',
    'PIL': 'PIL',
    'reportlab': 'reportlab',
    'python_docx': 'docx'
}

all_deps_ok = True
for name, import_name in required_deps.items():
    try:
        __import__(import_name)
        print(f"  ✓ {name}")
    except ImportError:
        print(f"  ✗ {name} NOT INSTALLED")
        all_deps_ok = False

if not all_deps_ok:
    print("\n⚠ Warning: Some dependencies are missing. The application may not work correctly.")

# Final summary
print("\n" + "=" * 60)
print("✓ All CORBA/IDL configuration tests passed!")
print("=" * 60)
print("\nYou can now safely start the Docker containers.")
print("Run: docker-compose up --build")
