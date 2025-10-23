

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
        showLoading('正在嵌入水印，请稍候...');

        const file = embedFileInput.files[0];
        const watermarkText = watermarkTextInput.value;

        if (!file || !watermarkText) {
            showError('请同时提供图片和水印文本。');
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
                successMessage.innerHTML = `成功！要解析此水印，请使用以下长度：<strong>${data.wm_length}</strong>`;
                
                // Auto-fill the length in the extract tab for convenience
                wmLengthInput.value = data.wm_length;

                processedImage.src = data.processed_image_url;
                downloadLink.href = data.processed_image_url;
                downloadLink.download = data.processed_image_url.split('/').pop();
                embedResultDiv.classList.remove('hidden');
            } else {
                showError(data.error || '发生未知错误。');
            }
        } catch (error) {
            showError('与服务器通信时发生错误。');
        } finally {
            hideLoading();
        }
    });

    // Extract button logic
    extractButton.addEventListener('click', async () => {
        hideMessages();
        showLoading('正在解析水印，请稍候...');

        const file = extractFileInput.files[0];
        const wmLength = wmLengthInput.value;

        if (!file || !wmLength) {
            showError('请同时提供图片和水印长度。');
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
                showError(data.error || '发生未知错误。');
            }
        } catch (error) {
            showError('与服务器通信时发生错误。');
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
