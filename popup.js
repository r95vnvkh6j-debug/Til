const { createFFmpeg, fetchFile } = FFmpeg;

// Vi använder window.location.origin för att garantera att 
// sökvägen till servern blir absolut, inte lokal (file://).
const baseUrl = window.location.origin;

// Initierar FFmpeg. Genom att enbart ange corePath hittar 
// v0.11 automatiskt .worker.js och .wasm i samma mapp.
const ffmpeg = createFFmpeg({ 
  corePath: `${baseUrl}/ffmpeg/ffmpeg-core.js`,
  log: true 
});

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const processingState = document.getElementById('processing-state');
    const successState = document.getElementById('success-state');
    const statusText = document.getElementById('status-text');
    const downloadBtn = document.getElementById('download-btn');

    if (browseBtn) {
        browseBtn.addEventListener('click', () => fileInput.click());
    }

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        processingState.classList.remove('hidden');
        successState.classList.add('hidden');
        statusText.innerText = "Laddar motor...";

        try {
            // Ladda FFmpeg om den inte redan är laddad
            if (!ffmpeg.isLoaded()) {
                await ffmpeg.load();
            }

            statusText.innerText = "Bearbetar...";
            
            // Skriv in filen i FFmpegs virtuella filsystem
            ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));

            // Kör FFmpeg-kommandot för att kopiera strömmarna
            await ffmpeg.run('-i', 'input.mp4', '-c', 'copy', 'output.mp4');

            // Läs ut den resulterande filen
            const data = ffmpeg.FS('readFile', 'output.mp4');
            
            // Kör din patcher (se till att den är laddad i index.html)
            const patched = window.KryptonMp4Patcher.patchKryptonContainer(data);
            
            // Skapa nedladdningsbar länk
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
