const { FFmpeg } = FFmpegWASM;
const ffmpeg = new FFmpeg();

document.getElementById('browse-btn').addEventListener('click', () => document.getElementById('file-input').click());

document.getElementById('file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById('processing-state').classList.remove('hidden');
  
  await ffmpeg.load({
    coreURL: "/ffmpeg/ffmpeg-core.js",
    wasmURL: "/ffmpeg/ffmpeg-core.wasm"
  });

  await ffmpeg.writeFile('input.mp4', await file.arrayBuffer());
  await ffmpeg.exec(['-i', 'input.mp4', '-c', 'copy', 'output.mp4']);
  
  const data = await ffmpeg.readFile('output.mp4');
  const patched = window.KryptonMp4Patcher.patchKryptonContainer(data);
  
  const url = URL.createObjectURL(new Blob([patched], { type: 'video/mp4' }));
  
  document.getElementById('processing-state').classList.add('hidden');
  document.getElementById('success-state').classList.remove('hidden');
  
  document.getElementById('download-btn').onclick = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fixed.mp4';
    a.click();
  };
});
