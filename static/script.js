

function openTab(evt, tabName) {
    // Get all elements with class="tab-content" and hide them
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tab-link" and remove the class "active"
    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}


document.addEventListener('DOMContentLoaded', () => {
    // Embed elements
    const embedButton = document.getElementById('embed-button');
    const embedFileInput = document.getElementById('embed_file');
    const watermarkTextInput = document.getElementById('embed_watermark_text');
    const embedResultDiv = document.getElementById('embed-result');
    const processedImage = document.getElementById('processed-image');
    const downloadLink = document.getElementById('download-link');

    // Extract elements
    const extractButton = document.getElementById('extract-button');
    const extractFileInput = document.getElementById('extract_file');
    const wmLengthInput = document.getElementById('extract_wm_length');
    const extractResultDiv = document.getElementById('extract-result');
    const extractedTextDiv = document.getElementById('extracted-text');

    // Common elements
    const loadingDiv = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    const errorMessageDiv = document.getElementById('error-message');

    // Embed button logic
    embedButton.addEventListener('click', async () => {
        hideMessages();
        showLoading('Embedding watermark, please wait...');

        const file = embedFileInput.files[0];
        const watermarkText = watermarkTextInput.value;

        if (!file || !watermarkText) {
            showError('Please provide both an image and watermark text.');
            hideLoading();
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('watermark_text', watermarkText);

        try {
            const response = await fetch('/embed', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (response.ok) {
                // Display success message with the exact watermark length
                const successMessage = document.getElementById('embed-success-message');
                successMessage.innerHTML = `Success! To extract the watermark, use this length: <strong>${data.wm_length}</strong>`;
                
                // Auto-fill the length in the extract tab for convenience
                wmLengthInput.value = data.wm_length;

                processedImage.src = data.processed_image_url;
                downloadLink.href = data.processed_image_url;
                downloadLink.download = data.processed_image_url.split('/').pop();
                embedResultDiv.classList.remove('hidden');
            } else {
                showError(data.error || 'An unknown error occurred.');
            }
        } catch (error) {
            showError('An error occurred while communicating with the server.');
        } finally {
            hideLoading();
        }
    });

    // Extract button logic
    extractButton.addEventListener('click', async () => {
        hideMessages();
        showLoading('Extracting watermark, please wait...');

        const file = extractFileInput.files[0];
        const wmLength = wmLengthInput.value;

        if (!file || !wmLength) {
            showError('Please provide both an image and the watermark length.');
            hideLoading();
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('wm_length', wmLength);

        try {
            const response = await fetch('/extract', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (response.ok) {
                extractedTextDiv.textContent = data.extracted_text;
                extractResultDiv.classList.remove('hidden');
            } else {
                showError(data.error || 'An unknown error occurred.');
            }
        } catch (error) {
            showError('An error occurred while communicating with the server.');
        } finally {
            hideLoading();
        }
    });

    function showLoading(message) {
        loadingText.textContent = message;
        loadingDiv.classList.remove('hidden');
    }

    function hideLoading() {
        loadingDiv.classList.add('hidden');
    }

    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.remove('hidden');
    }

    function hideMessages() {
        embedResultDiv.classList.add('hidden');
        extractResultDiv.classList.add('hidden');
        errorMessageDiv.classList.add('hidden');
    }
});
