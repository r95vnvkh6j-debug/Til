// Initiera FFmpeg - utan manuella sökvägar för att undvika 404
const { FFmpeg } = FFmpegWASM;
const ffmpeg = new FFmpeg();

// Referenser till UI-element
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const processingState = document.getElementById('processing-state');
const successState = document.getElementById('success-state');
const statusText = document.getElementById('status-text');
const downloadBtn = document.getElementById('download-btn');

// Klicka på knappen för att trigga filväljaren
browseBtn.addEventListener('click', () => fileInput.click());

// Huvudlogik
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  processingState.classList.remove('hidden');
  successState.classList.add('hidden');
  statusText.innerText = "Laddar motor...";

  try {
    if (!ffmpeg.loaded) {
      // Genom att lämna load() tom hämtar biblioteket 
      // alla filer (inklusive 814.ffmpeg.js) från ett officiellt CDN.
      await ffmpeg.load();
    }

    statusText.innerText = "Bearbetar...";
    
    // Skriv filen
    await ffmpeg.writeFile('input.mp4', await file.arrayBuffer());

    // Kör FFmpeg - kopierar strömmarna utan att koda om (bevarar kvalitet)
    await ffmpeg.exec([
      '-i', 'input.mp4', 
      '-c', 'copy', 
      'output.mp4'
    ]);

    // Läs resultatet
    const data = await ffmpeg.readFile('output.mp4');
    
    // Applicera din Krypton-patch för att förhindra komprimering
    const patched = window.KryptonMp4Patcher.patchKryptonContainer(data);
    
    // Skapa nedladdningslänk
    const url = URL.createObjectURL(new Blob([patched], { type: 'video/mp4' }));

    processingState.classList.add('hidden');
    successState.classList.remove('hidden');

    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'krypton_fixed.mp4';
      a.click();
    };

  } catch (err) {
    console.error("FFmpeg Error:", err);
    statusText.innerText = "Error: " + err.message;
  }
});
