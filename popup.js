const { createFFmpeg, fetchFile } = FFmpeg;

const ffmpeg = createFFmpeg({ 
  corePath: `${window.location.origin}/ffmpeg/ffmpeg-core.js`,
  log: true 
});

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const processingState = document.getElementById('processing-state');
    const successState = document.getElementById('success-state');
    const statusText = document.getElementById('status-text');
    const downloadBtn = document.getElementById('download-btn');

    if (browseBtn) browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        processingState.classList.remove('hidden');
        successState.classList.add('hidden');
        statusText.innerText = "Laddar motor...";

        try {
            if (!ffmpeg.isLoaded()) {
                await ffmpeg.load();
            }

            statusText.innerText = "Bearbetar...";
            ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));
            await ffmpeg.run('-i', 'input.mp4', '-c', 'copy', 'output.mp4');

            const data = ffmpeg.FS('readFile', 'output.mp4');
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
            statusText.innerText = "Error: " + err.message;
        }
    });
});
