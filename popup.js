const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const statusText = document.getElementById('status-text');

browseBtn.addEventListener('click', () => fileInput.click());

// Uppdatera status baserat på FFmpegs framsteg
ffmpeg.setProgress(({ ratio }) => {
  statusText.innerText = `Processing: ${Math.round(ratio * 100)}%`;
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    statusText.innerText = "Loading engine...";
    if (!ffmpeg.isLoaded()) await ffmpeg.load();

    statusText.innerText = "Encoding (don't close)...";
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));
    
    // Vi använder "ultrafast" preset för att inte krascha mobilens minne
    await ffmpeg.run(
      '-i', 'input.mp4',
      '-c:v', 'libx264',
      '-crf', '23',           // Standardkvalitet (CRF 18 var för tungt för RAM)
      '-preset', 'ultrafast', // Tvingar den att köra snabbt
      '-profile:v', 'main',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      'output.mp4'
    );

    const data = ffmpeg.FS('readFile', 'output.mp4');
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tiktok_fixed.mp4';
    a.click();
    
    statusText.innerText = "Done!";
  } catch (err) {
    statusText.innerText = "Failed: " + err.message;
    console.error(err);
  }
});
