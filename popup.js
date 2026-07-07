const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const uploadContent = document.getElementById('upload-content');
const processingState = document.getElementById('processing-state');
const statusText = document.getElementById('status-text');

browseBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  uploadContent.classList.add('hidden');
  processingState.classList.remove('hidden');

  const formData = new FormData();
  formData.append('video', file);

  try {
    const response = await fetch('/api/process', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Server error');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    // Visa success-state här...
    alert("Video färdigbehandlad!");
    window.location.href = url; // Ladda ner direkt
  } catch (err) {
    alert("FEL: " + err.message);
    uploadContent.classList.remove('hidden');
    processingState.classList.add('hidden');
  }
});
