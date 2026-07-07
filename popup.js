const { FFmpeg } = FFmpegWASM;
const ffmpeg = new FFmpeg();

const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const processingState = document.getElementById('processing-state');
const successState = document.getElementById('success-state');
const statusText = document.getElementById('status-text');
const progressBar = document.getElementById('progress-bar');
const downloadBtn = document.getElementById('download-btn');

ffmpeg.on('progress', ({ progress }) => {
  progressBar.style.width = `${Math.round(progress * 100)}%`;
});

browseBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  processingState.classList.remove('hidden');
  successState.classList.add('hidden');
  statusText.innerText = "Laddar motor...";

  try {
    if (!ffmpeg.loaded) {
      await ffmpeg.load({
        coreURL: '/ffmpeg/ffmpeg-core.js',
        wasmURL: '/ffmpeg/ffmpeg-core.wasm',
      });
    }

    statusText.innerText = "Bearbetar...";
    await ffmpeg.writeFile('input.mp4', await file.arrayBuffer());

    await ffmpeg.exec([
      '-i', 'input.mp4', 
      '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.2',
      '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart',
      'output.mp4'
    ]);

    const data = await ffmpeg.readFile('output.mp4');
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
    console.error(err);
    statusText.innerText = "Error: " + err.message;
  }
});
