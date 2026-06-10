document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('pdfFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showError('Please select a PDF file!');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Show loading spinner
    document.getElementById('loading').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('originalText').innerHTML = data.original_text_preview;
            document.getElementById('translatedText').innerHTML = data.translated_text.replace(/\n/g, '<br>');
            document.getElementById('downloadLink').href = data.download_link;
            document.getElementById('result').style.display = 'block';
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
});

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.innerHTML = message;
    errorDiv.style.display = 'block';
    // Import PDF.js library – aapke HTML mein pehle se ho toh theek, warna add karo:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>

async function translateToHinglish(file, onSuccess, onError) {
    // Step 1: File type check
    if (!file) {
        if (onError) onError("Koi file select karo!");
        return;
    }

    const fileType = file.type;
    const isPDF = fileType === 'application/pdf';
    const isImage = fileType.startsWith('image/');
    
    if (!isPDF && !isImage) {
        if (onError) onError("Sirf PDF ya image file (JPG, PNG) allowed hai.");
        return;
    }

    try {
        // Step 2: Extract text from file
        let extractedText = "";
        if (isPDF) {
            extractedText = await extractTextFromPDF(file);
        } else {
            extractedText = await extractTextFromImage(file);
        }

        if (!extractedText.trim()) {
            throw new Error("File mein koi readable text nahi mila. Scanned PDF ya blurry image ho sakti hai.");
        }

        // Step 3: Translate English to Hindi (using free MyMemory API)
        const hindiText = await translateToHindi(extractedText);
        
        // Step 4: Convert Hindi (Devanagari) to Hinglish (Roman)
        const hinglishText = devanagariToRoman(hindiText);
        
        // Step 5: Success callback
        if (onSuccess) onSuccess(hinglishText, extractedText);
        
    } catch (err) {
        if (onError) onError("Translation failed: " + err.message);
    }
}

// ----- Helper functions (internal) -----

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
}

async function extractTextFromImage(file) {
    // Image text extraction without OCR – only if image contains selectable text (unlikely)
    // For real OCR, you'd need Tesseract.js (heavy). Here we show a placeholder.
    // Note: Client-side OCR from image is complex. We'll return a warning.
    throw new Error("Client-side image text extraction without OCR is not possible. Please use a text-based PDF or upload a PDF with selectable text.");
}

async function translateToHindi(text, chunkSize = 4000) {
    // Using MyMemory API (free, no key) – returns Devanagari Hindi
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    let translatedFull = '';
    for (let chunk of chunks) {
        if (!chunk.trim()) continue;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|hi`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.responseData && data.responseData.translatedText) {
            translatedFull += data.responseData.translatedText + ' ';
        } else {
            translatedFull += chunk + ' ';
        }
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
    }
    return translatedFull;
}

function devanagariToRoman(text) {
    // Simple mapping for common Devanagari characters to Roman (Hinglish)
    // This is not perfect but gives readable output for most common words.
    const map = {
        'अ':'a','आ':'aa','इ':'i','ई':'ee','उ':'u','ऊ':'oo','ऋ':'ri','ए':'e','ऐ':'ai','ओ':'o','औ':'au',
        'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'ng','च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'ny',
        'ट':'t','ठ':'th','ड':'d','ढ':'dh','ण':'n','त':'t','थ':'th','द':'d','ध':'dh','न':'n','प':'p','फ':'ph',
        'ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','श':'sh','ष':'sh','स':'s','ह':'h',
        'क्ष':'ksh','त्र':'tr','ज्ञ':'gy','श्र':'shr',
        'ा':'aa','ि':'i','ी':'ee','ु':'u','ू':'oo','ृ':'ri','े':'e','ै':'ai','ो':'o','ौ':'au','ं':'n','ः':'h','्':''
    };
    let result = '';
    for (let i = 0; i < text.length; i++) {
        let ch = text[i];
        let matched = false;
        // Check for two-character sequences (like क्ष)
        if (i+1 < text.length && map[text[i] + text[i+1]]) {
            result += map[text[i] + text[i+1]];
            i++;
            matched = true;
        } else if (map[ch]) {
            result += map[ch];
            matched = true;
        } else {
            result += ch;
        }
    }
    // Basic spacing fix (remove extra spaces around punctuation)
    return result.replace(/\s+/g, ' ').trim();
        }
}
