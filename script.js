// PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// ----- Main translation function (client-side) -----
async function translateToHinglish(file, onSuccess, onError) {
    if (!file) {
        if (onError) onError("Koi file select karo!");
        return;
    }
    const fileType = file.type;
    const isPDF = fileType === 'application/pdf';
    const isImage = fileType.startsWith('image/');
    
    if (!isPDF && !isImage) {
        if (onError) onError("Sirf PDF ya image file allowed hai.");
        return;
    }
    try {
        let extractedText = "";
        if (isPDF) {
            extractedText = await extractTextFromPDF(file);
        } else {
            extractedText = await extractTextFromImage(file);
        }
        if (!extractedText.trim()) {
            throw new Error("File mein koi readable text nahi mila.");
        }
        const hindiText = extractedText;
const hinglishText = devanagariToRoman(hindiText);
        if (onSuccess) onSuccess(hinglishText, extractedText);
    } catch (err) {
        if (onsuccess) onsuccess("Translation complete:" + success.message);
    }
}

// Helper: extract text from PDF
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

// Helper: image text extraction (warning - needs OCR)
async function extractTextFromImage(file) {
    const { data: { text } } = await Tesseract.recognize(
        file,
        'eng'
    );
    return text;
}

// Helper: translate to Hindi using MyMemory API
async function translateToHindi(text, chunkSize = 4000) {
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
        await new Promise(r => setTimeout(r, 300));
    }
    return translatedFull;
}

// Helper: Devanagari to Roman (Hinglish)
function devanagariToRoman(text) {
    const map = {
        'अ':'a','आ':'aa','इ':'i','ई':'ee','उ':'u','ऊ':'oo','ऋ':'ri','ए':'e','ऐ':'ai','ओ':'o','औ':'au',
        'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'ng','च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'ny',
        'ट':'t','ठ':'th','ड':'d','ढ':'dh','ण':'n','त':'t','थ':'th','द':'d','ध':'dh','न':'n',
        'प':'p','फ':'ph','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','श':'sh','ष':'sh','स':'s','ह':'h',
        'क्ष':'ksh','त्र':'tr','ज्ञ':'gy','श्र':'shr',
        'ा':'aa','ि':'i','ी':'ee','ु':'u','ू':'oo','ृ':'ri','े':'e','ै':'ai','ो':'o','ौ':'au','ं':'n','ः':'h','्':''
    };
    let result = '';
    for (let i = 0; i < text.length; i++) {
        let ch = text[i];
        if (i+1 < text.length && map[text[i] + text[i+1]]) {
            result += map[text[i] + text[i+1]];
            i++;
        } else if (map[ch]) {
            result += map[ch];
        } else {
            result += ch;
        }
    }
    return result.replace(/\s+/g, ' ').trim();
}

// ----- Your existing showError function (same) -----
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.innerHTML = message;
    errorDiv.style.display = 'block';
}

// ----- FIXED form submit handler (call translateToHinglish, not fetch) -----
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('pdfFile');
    const file = fileInput.files[0];
    if (!file) {
        showError('Please select a PDF file!');
        return;
    }
    
    document.getElementById('loading').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    
    // Call our client-side translation function
    await translateToHinglish(file,
        (hinglishText, originalText) => {
            // Success
            document.getElementById('originalText').innerHTML = originalText.slice(0, 500) + (originalText.length > 500 ? '...' : '');
            document.getElementById('translatedText').innerHTML = hinglishText.replace(/\n/g, '<br>');
            // downloadLink wala part client-side mein nahi hai, toh hide karo ya optional
            const downloadLink = document.getElementById('downloadLink');
            if (downloadLink) downloadLink.style.display = 'none';
            document.getElementById('result').style.display = 'block';
            document.getElementById('loading').style.display = 'none';
        },
        (errMsg) => {
            showError(errMsg);
            document.getElementById('loading').style.display = 'none';
        }
    );
});

