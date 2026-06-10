#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import tempfile
import PyPDF2
import pdfplumber
from flask import Flask, request, render_template, send_file, jsonify
from werkzeug.utils import secure_filename
from googletrans import Translator

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
ALLOWED_EXTENSIONS = {'pdf'}

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('templates', exist_ok=True)
os.makedirs('static', exist_ok=True)   # static folder for CSS/JS

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"PyPDF2 error: {e}, trying pdfplumber...")
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e2:
            raise Exception(f"PDF extraction failed: {e2}")
    if not text.strip():
        raise Exception("No text found in PDF - yeh scanned PDF ho sakta hai?")
    return text

def translate_to_hindi(text, chunk_size=5000):
    translator = Translator()
    translated_chunks = []
    for i in range(0, len(text), chunk_size):
        chunk = text[i:i+chunk_size]
        if chunk.strip():
            try:
                translated = translator.translate(chunk, src='en', dest='hi')
                translated_chunks.append(translated.text)
            except Exception as e:
                print(f"Translation error for chunk {i}: {e}")
                translated_chunks.append(chunk)
    return ' '.join(translated_chunks)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF files are allowed'}), 400
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    try:
        extracted_text = extract_text_from_pdf(filepath)
        translated_text = translate_to_hindi(extracted_text)
        
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8')
        temp_file.write(translated_text)
        temp_file.close()
        
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'original_text_preview': extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
            'translated_text': translated_text,
            'download_link': f'/download/{os.path.basename(temp_file.name)}'
        })
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>')
def download_file(filename):
    temp_dir = tempfile.gettempdir()
    filepath = os.path.join(temp_dir, filename)
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True, download_name='translated_text.txt')
    else:
        return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    print("\n🚀 PDF to Hinglish Translator is starting...")
    print("📂 Open browser and go to: http://localhost:5000")
    print("🔧 Press CTRL+C to stop the server\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
# Add this import at top
from transliterate import translit

def translate_to_hinglish(text, chunk_size=5000):
    translator = Translator()
    translated_chunks = []
    for i in range(0, len(text), chunk_size):
        chunk = text[i:i+chunk_size]
        if chunk.strip():
            try:
                # Translate English to Hindi (Devanagari)
                hindi_text = translator.translate(chunk, src='en', dest='hi').text
                # Convert Devanagari to Roman (Hinglish)
                hinglish_text = translit(hindi_text, 'hi', reversed=True)
                translated_chunks.append(hinglish_text)
            except Exception as e:
                print(f"Translation error: {e}")
                translated_chunks.append(chunk)
    return ' '.join(translated_chunks)

# Andar upload route mein call karo:
translated_text = translate_to_hinglish(extracted_text)
