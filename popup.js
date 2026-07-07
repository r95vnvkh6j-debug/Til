const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const statusText = document.getElementById('status-text');

browseBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    statusText.innerText = "Initializing engine...";
    if (!ffmpeg.isLoaded()) await ffmpeg.load();

    statusText.innerText = "Processing video...";
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));
    
    // Utför bearbetningen lokalt
    await ffmpeg.run('-i', 'input.mp4', '-c', 'copy', 'output.mp4');

    const data = ffmpeg.FS('readFile', 'output.mp4');
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    
    // Skapa nedladdning
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fixed-video.mp4';
    a.click();
    
    statusText.innerText = "Success!";
  } catch (err) {
    statusText.innerText = "Error: " + err.message;
    console.error("Feldetaljer:", err);
  }
});
