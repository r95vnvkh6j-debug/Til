// Initiera FFmpeg
const { FFmpeg } = FFmpegWASM;
const ffmpeg = new FFmpeg();

const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const processingState = document.getElementById('processing-state');
const successState = document.getElementById('success-state');
const statusText = document.getElementById('status-text');
const downloadBtn = document.getElementById('download-btn');

browseBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  processingState.classList.remove('hidden');
  successState.classList.add('hidden');
  statusText.innerText = "Laddar motor...";

  try {
    if (!ffmpeg.loaded) {
      // VIKTIGT: Vi anger specifika lokala sökvägar för alla delar
      // Detta tvingar biblioteket att hålla sig inom din domän
      await ffmpeg.load({
        coreURL: "/ffmpeg/ffmpeg-core.js",
        wasmURL: "/ffmpeg/ffmpeg-core.wasm",
        workerURL: "/ffmpeg/ffmpeg.js" 
      });
    }

    statusText.innerText = "Bearbetar...";
    
    await ffmpeg.writeFile('input.mp4', await file.arrayBuffer());

    // Kör FFmpeg - kopierar strömmarna utan att koda om
    await ffmpeg.exec([
      '-i', 'input.mp4', 
      '-c', 'copy', 
      'output.mp4'
    ]);

    const data = await ffmpeg.readFile('output.mp4');
    
    // Applicera din patcher-funktion
    const patched = window.KryptonMp4Patcher.patchKryptonContainer(data);
    
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
    // Om det fortfarande kastar SecurityError, så betyder det att 
    // webbläsaren blockerar worker-skriptet.
    statusText.innerText = "Error: " + err.message;
  }
});
