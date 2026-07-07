const { createFFmpeg, fetchFile } = FFmpeg;

// Vi använder den officiella unpkg-källan direkt
// Detta kringgår alla problem med lokala sökvägar och MIME-types
const ffmpeg = createFFmpeg({ 
  corePath: "https://unpkg.com/@ffmpeg/core@0.11.6/dist/ffmpeg-core.js",
  log: true 
});

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const statusText = document.getElementById('status-text');

    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        statusText.innerText = "Laddar motor från CDN...";

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
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'krypton_fixed.mp4';
            a.click();
            statusText.innerText = "Klar!";
        } catch (err) {
            console.error("FFmpeg Error:", err);
            statusText.innerText = "Error: " + err.message;
        }
    });
});
