import sys
import os
import io
import json
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from omniORB import CORBA
import pdfservice

app = Flask(__name__)
CORS(app)

# Initialize ORB and get reference to PdfManager
orb = CORBA.ORB_init(sys.argv, CORBA.ORB_ID)

def get_conversion_service():
    try:
        obj = orb.resolve_initial_references("NameService")
        import CosNaming
        rootContext = obj._narrow(CosNaming.NamingContext)
        name = [CosNaming.NameComponent("PdfManager", "")]
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

@app.route('/api/pdf/merge', methods=['POST'])
def merge_pdfs():
    files = request.files.getlist('files')
    if not files or len(files) == 0:
        return jsonify({"error": "No files selected for merging"}), 400
        
    service = get_conversion_service()
    if not service:
        return jsonify({"error": "CORBA backend not available"}), 503
        
    try:
        pdf_bytes_list = [f.read() for f in files]
        merged_bytes = service.mergePdfs(pdf_bytes_list)
        if not merged_bytes:
            return jsonify({"error": "Merge failed on backend"}), 500
        return send_file(
            io.BytesIO(merged_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name='merged.pdf'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/pdf/watermark', methods=['POST'])
def watermark_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    text = request.form.get('text', '')
    opacity = float(request.form.get('opacity', 0.15))
    angle = float(request.form.get('angle', 45))
    fontSize = float(request.form.get('fontSize', 60))
    x = float(request.form.get('x', 50))
    y = float(request.form.get('y', 50))
    allPages = request.form.get('allPages', 'true').lower() == 'true'

    pdf_bytes = file.read()

    service = get_conversion_service()
    if not service:
        return jsonify({"error": "CORBA backend not available"}), 503

    try:
        # Build WatermarkData struct compatible with IDL
        watermark = pdfservice.WatermarkData(
            text,
            opacity,
            angle,
            fontSize,
            x,
            y,
            allPages,
        )

        wm_bytes = service.watermarkPdf(pdf_bytes, watermark)
        if not wm_bytes:
            return jsonify({"error": "Watermark failed on backend"}), 500

        return send_file(
            io.BytesIO(wm_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{os.path.splitext(file.filename)[0]}_watermarked.pdf"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

        return send_file(
            io.BytesIO(merged_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name='merged.pdf'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pdf/split', methods=['POST'])
def split_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    
    pages_str = request.form.get('pagesToKeep', '')
    if not pages_str:
        return jsonify({"error": "No pages specified for splitting"}), 400
        
    try:
        pages_to_keep = [int(p) for p in pages_str.split(',') if p.strip() != '']
    except Exception:
        return jsonify({"error": "Invalid pages format"}), 400
        
    service = get_conversion_service()
    if not service:
        return jsonify({"error": "CORBA backend not available"}), 503
        
    try:
        pdf_bytes = file.read()
        split_bytes = service.splitPdf(pdf_bytes, pages_to_keep)
        if not split_bytes:
            return jsonify({"error": "Split failed on backend"}), 500
            
        original_name = os.path.splitext(file.filename)[0]
        download_name = f"{original_name}_split.pdf"
            
        return send_file(
            io.BytesIO(split_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=download_name
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pdf/delete-pages', methods=['POST'])
def delete_pages():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    
    pages_str = request.form.get('pagesToDelete', '')
    if not pages_str:
        # If empty pages to delete, just return the file as-is
        pages_to_delete = []
    else:
        try:
            pages_to_delete = [int(p) for p in pages_str.split(',') if p.strip() != '']
        except Exception:
            return jsonify({"error": "Invalid pages format"}), 400
            
    service = get_conversion_service()
    if not service:
        return jsonify({"error": "CORBA backend not available"}), 503
        
    try:
        pdf_bytes = file.read()
        modified_bytes = service.deletePages(pdf_bytes, pages_to_delete)
        if not modified_bytes:
            return jsonify({"error": "Delete pages failed on backend"}), 500
            
        original_name = os.path.splitext(file.filename)[0]
        download_name = f"{original_name}_modified.pdf"
            
        return send_file(
            io.BytesIO(modified_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=download_name
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pdf/rotate', methods=['POST'])
def rotate_pages():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    
    rotations_json = request.form.get('rotations', '{}')
    try:
        rot_dict = json.loads(rotations_json)
    except Exception:
        return jsonify({"error": "Invalid rotations format"}), 400
        
    service = get_conversion_service()
    if not service:
        return jsonify({"error": "CORBA backend not available"}), 503
        
    try:
        rot_list = []
        for page_num_str, angle in rot_dict.items():
            rot_list.append(pdfservice.RotationEntry(pageNum=int(page_num_str), angle=int(angle)))
            
        pdf_bytes = file.read()
        rotated_bytes = service.rotatePages(pdf_bytes, rot_list)
        if not rotated_bytes:
            return jsonify({"error": "Rotation failed on backend"}), 500
            
        original_name = os.path.splitext(file.filename)[0]
        download_name = f"{original_name}_rotated.pdf"
            
        return send_file(
            io.BytesIO(rotated_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=download_name
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pdf/compress', methods=['POST'])
def compress_pdf():
    files = request.files.getlist('files')
    if not files or len(files) == 0:
        return jsonify({"error": "No files selected for compression"}), 400
        
    service = get_conversion_service()
    if not service:
        return jsonify({"error": "CORBA backend not available"}), 503
        
    try:
        if len(files) > 1:
            pdf_bytes_list = [f.read() for f in files]
            pdf_bytes = service.mergePdfs(pdf_bytes_list)
        else:
            pdf_bytes = files[0].read()
            
        compressed_bytes = service.compressPdf(pdf_bytes)
        if not compressed_bytes:
            return jsonify({"error": "Compression failed on backend"}), 500
            
        original_name = os.path.splitext(files[0].filename)[0]
        download_name = f"{original_name}_compressed.pdf"
            
        return send_file(
            io.BytesIO(compressed_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=download_name
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pdf/protect', methods=['POST'])
def protect_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    
    password = request.form.get('password', '')
    no_copy = request.form.get('noCopy') == 'true'
    no_print = request.form.get('noPrint') == 'true'
    no_edit = request.form.get('noEdit') == 'true'
    no_annotate = request.form.get('noAnnotate') == 'true'
    
    print(f"Protection request: password={'*' * len(password) if password else '[empty]'}, noCopy={no_copy}, noPrint={no_print}, noEdit={no_edit}, noAnnotate={no_annotate}", flush=True)
    
    service = get_conversion_service()
    if not service:
        return jsonify({"error": "CORBA backend not available"}), 503
        
    try:
        # Create CORBA struct with protection options
        options = pdfservice.ProtectionOptions(
            password=password,
            noCopy=no_copy,
            noPrint=no_print,
            noEdit=no_edit,
            noAnnotate=no_annotate
        )
        pdf_bytes = file.read()
        print(f"Calling protectPdf with {len(pdf_bytes)} bytes", flush=True)
        protected_bytes = service.protectPdf(pdf_bytes, options)
        if not protected_bytes:
            return jsonify({"error": "Protection failed on backend"}), 500
            
        original_name = os.path.splitext(file.filename)[0]
        download_name = f"{original_name}_protected.pdf"
            
        return send_file(
            io.BytesIO(protected_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=download_name
        )
    except Exception as e:
        print(f"Error in protect_pdf: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/pdf/image-to-pdf', methods=['POST'])
def image_to_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    
    mime_type = request.form.get('mimeType', file.mimetype)
    
    service = get_conversion_service()
    if not service:
        return jsonify({"error": "CORBA backend not available"}), 503
        
    try:
        img_bytes = file.read()
        pdf_bytes = service.imageToPdf(img_bytes, mime_type)
        if not pdf_bytes:
            return jsonify({"error": "Image to PDF failed on backend"}), 500
            
        original_name = os.path.splitext(file.filename)[0]
        download_name = f"{original_name}_image.pdf"
            
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=download_name
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pdf/sign', methods=['POST'])
def sign_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    
    signature_type = request.form.get('signatureType', 'type')
    signature_content = request.form.get('signatureContent', '')
    x = float(request.form.get('x', '0'))
    y = float(request.form.get('y', '0'))
    page_num = int(request.form.get('pageNum', '1'))
    
    service = get_conversion_service()
    if not service:
        return jsonify({"error": "CORBA backend not available"}), 503
        
    try:
        signature = pdfservice.SignatureData(
            type=signature_type,
            content=signature_content,
            x=x,
            y=y,
            pageNum=page_num
        )
        pdf_bytes = file.read()
        signed_bytes = service.signPdf(pdf_bytes, signature)
        if not signed_bytes:
            return jsonify({"error": "Signing failed on backend"}), 500
            
        original_name = os.path.splitext(file.filename)[0]
        download_name = f"{original_name}_signed.pdf"
            
        return send_file(
            io.BytesIO(signed_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=download_name
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pdf/create-form', methods=['POST'])
def create_form():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    
    fields_json = request.form.get('fields', '[]')
    target_page = int(request.form.get('targetPage', '1'))
    
    try:
        fields_data = json.loads(fields_json)
    except Exception:
        return jsonify({"error": "Invalid fields format"}), 400
        
    service = get_conversion_service()
    if not service:
        return jsonify({"error": "CORBA backend not available"}), 503
        
    try:
        fields_list = []
        for f in fields_data:
            fields_list.append(
                pdfservice.FormField(
                    fieldId=str(f.get('id', '')),
                    fieldType=str(f.get('type', 'text')),
                    x=float(f.get('x', 0)),
                    y=float(f.get('y', 0)),
                    label=str(f.get('label', '')),
                    val=str(f.get('value', ''))
                )
            )
            
        pdf_bytes = file.read()
        form_bytes = service.createForm(pdf_bytes, fields_list, target_page)
        if not form_bytes:
            return jsonify({"error": "Form creation failed on backend"}), 500
            
        original_name = os.path.splitext(file.filename)[0]
        download_name = f"{original_name}_form.pdf"
            
        return send_file(
            io.BytesIO(form_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=download_name
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run the Flask app on port 3001
    app.run(host='0.0.0.0', port=3001, debug=False)
