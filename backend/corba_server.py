import sys
import os
from omniORB import CORBA, PortableServer
import pdfservice, pdfservice__POA

import tempfile
from pdf2docx import Converter
import pytesseract
from PIL import Image
import io
import docx

class ConversionImpl(pdfservice__POA.Conversion):
    def convertPdfToWord(self, pdfFile):
        print("Received PDF to Word conversion request.", flush=True)
        try:
            # Save bytes to a temp PDF file
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_pdf:
                temp_pdf.write(pdfFile)
                temp_pdf_path = temp_pdf.name
            
            # Create a temp DOCX file path
            temp_docx_path = temp_pdf_path.replace(".pdf", ".docx")
            
            # Convert using pdf2docx
            print(f"Converting {temp_pdf_path} to {temp_docx_path}...", flush=True)
            cv = Converter(temp_pdf_path)
            cv.convert(temp_docx_path, start=0, end=None)
            cv.close()
            
            # Read DOCX back
            with open(temp_docx_path, "rb") as f:
                docx_bytes = f.read()
                
            # Cleanup
            os.remove(temp_pdf_path)
            os.remove(temp_docx_path)
            
            print("Conversion successful.", flush=True)
            return docx_bytes
        except Exception as e:
            print(f"Error during PDF to Word conversion: {e}", flush=True)
            return b""

    def performOcr(self, imageFile):
        print("Received OCR request.", flush=True)
        try:
            # Read image from bytes
            image = Image.open(io.BytesIO(imageFile))
            # Perform OCR (French + English if available, or just French)
            print("Running tesseract...", flush=True)
            text = pytesseract.image_to_string(image, lang='fra+eng')
            
            # Create a Word document
            doc = docx.Document()
            doc.add_heading('Résultat OCR', 0)
            doc.add_paragraph(text)
            
            # Save to bytes
            docx_io = io.BytesIO()
            doc.save(docx_io)
            print("OCR successful.", flush=True)
            return docx_io.getvalue()
        except Exception as e:
            print(f"Error during OCR: {e}", flush=True)
            return b""

def main():
    # Initialize ORB
    orb = CORBA.ORB_init(sys.argv, CORBA.ORB_ID)
    
    # Get RootPOA
    poa = orb.resolve_initial_references("RootPOA")
    poaManager = poa._get_the_POAManager()
    poaManager.activate()
    
    # Create implementation
    servant = ConversionImpl()
    
    # Register to Naming Service
    try:
        obj = orb.resolve_initial_references("NameService")
        import CosNaming
        rootContext = obj._narrow(CosNaming.NamingContext)
        
        name = [CosNaming.NameComponent("ConversionService", "")]
        rootContext.rebind(name, servant._this())
        print("Successfully bound to NameService.", flush=True)
    except Exception as e:
        print(f"Failed to bind to NameService: {e}", flush=True)
        sys.exit(1)
        
    print("CORBA Conversion Server is running...", flush=True)
    orb.run()

if __name__ == "__main__":
    main()
