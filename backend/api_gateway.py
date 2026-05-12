import sys
import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from omniORB import CORBA
import pdfservice
import io

app = Flask(__name__)
CORS(app)

# Initialize ORB and get reference to ConversionService
orb = CORBA.ORB_init(sys.argv, CORBA.ORB_ID)

def get_conversion_service():
    try:
        obj = orb.resolve_initial_references("NameService")
        import CosNaming
        rootContext = obj._narrow(CosNaming.NamingContext)
        name = [CosNaming.NameComponent("ConversionService", "")]
        obj = rootContext.resolve(name)
        return obj._narrow(pdfservice.Conversion)
    except Exception as e:
        print(f"Failed to connect to CORBA service: {e}", flush=True)
        return None

@app.route('/api/ocr', methods=['POST'])
def ocr():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    image_bytes = file.read()
    
    service = get_conversion_service()
    if not service:
        return jsonify({"error": "CORBA backend not available"}), 503
        
    try:
        docx_bytes = service.performOcr(image_bytes)
        if not docx_bytes:
            return jsonify({"error": "OCR failed on backend"}), 500
            
        return send_file(
            io.BytesIO(docx_bytes),
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name='ocr_result.docx'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/convert/pdf-to-word', methods=['POST'])
def convert_pdf_to_word():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    pdf_bytes = file.read()
    
    service = get_conversion_service()
    if not service:
        return jsonify({"error": "CORBA backend not available"}), 503
        
    try:
        docx_bytes = service.convertPdfToWord(pdf_bytes)
        if not docx_bytes:
            return jsonify({"error": "Conversion failed on backend"}), 500
            
        # Change filename extension
        original_name = os.path.splitext(file.filename)[0]
        download_name = f"{original_name}_converted.docx"
            
        return send_file(
            io.BytesIO(docx_bytes),
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=download_name
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run the Flask app on port 3001
    app.run(host='0.0.0.0', port=3001, debug=False)
