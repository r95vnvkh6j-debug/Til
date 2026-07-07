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
    statusText.innerText = "Initializing...";
    if (!ffmpeg.isLoaded()) await ffmpeg.load();

    statusText.innerText = "Processing for TikTok...";
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));
    
    // VIKTIGT: Vi kodar om med inställningar som TikTok inte rör
    await ffmpeg.run(
      '-i', 'input.mp4',
      '-c:v', 'libx264',      // Använd x264
      '-crf', '18',           // Hög kvalitet (lägre siffra = bättre)
      '-profile:v', 'high',   // TikToks favorit-profil
      '-level', '4.2',
      '-pix_fmt', 'yuv420p',  // Viktigt för kompatibilitet
      '-c:a', 'aac',          // Standard ljud
      'output.mp4'
    );

    const data = ffmpeg.FS('readFile', 'output.mp4');
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tiktok_ready.mp4';
    a.click();
    
    statusText.innerText = "Done! Upload this version.";
  } catch (err) {
    statusText.innerText = "Error: " + err.message;
    console.error(err);
  }
});
