// Initiera FFmpeg från den lokala filen
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

// Huvudlogik för filhantering
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Uppdatera UI: Visa laddningsläge
  processingState.classList.remove('hidden');
  successState.classList.add('hidden');
  statusText.innerText = "Laddar motor...";

  try {
    // Ladda FFmpeg lokalt
    if (!ffmpeg.loaded) {
      await ffmpeg.load({
        coreURL: "/ffmpeg/ffmpeg-core.js",
        wasmURL: "/ffmpeg/ffmpeg-core.wasm"
      });
    }

    statusText.innerText = "Bearbetar...";
    
    // Skriv filen till FFmpeg:s virtuella filsystem
    await ffmpeg.writeFile('input.mp4', await file.arrayBuffer());

    // Kör FFmpeg-kommandot
    await ffmpeg.exec([
      '-i', 'input.mp4', 
      '-c', 'copy', 
      'output.mp4'
    ]);

    // Läs resultatet
    const data = await ffmpeg.readFile('output.mp4');
    
    // Kör din patcher-funktion
    const patched = window.KryptonMp4Patcher.patchKryptonContainer(data);
    
    // Skapa en nedladdningsbar länk
    const url = URL.createObjectURL(new Blob([patched], { type: 'video/mp4' }));

    // Uppdatera UI: Visa success
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
