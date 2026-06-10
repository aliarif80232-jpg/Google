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
}
