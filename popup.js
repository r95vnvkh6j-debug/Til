const { createFFmpeg, fetchFile } = FFmpeg;

const baseUrl = window.location.origin;

// Vi definierar locateFile strikt för att garantera att 
// alla FFmpeg-delar hämtas från rätt URL och inte gissar.
const ffmpeg = createFFmpeg({ 
  corePath: `${baseUrl}/ffmpeg/ffmpeg-core.js`,
  locateFile: (path, prefix) => {
    if (path.endsWith('.worker.js')) return `${baseUrl}/ffmpeg/ffmpeg-core.worker.js`;
    if (path.endsWith('.wasm')) return `${baseUrl}/ffmpeg/ffmpeg-core.wasm`;
    return prefix + path;
  },
  log: true 
});

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const statusText = document.getElementById('status-text');

    if (browseBtn) {
        browseBtn.addEventListener('click', () => fileInput.click());
    }

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        statusText.innerText = "Laddar motor...";

        try {
            // Ladda FFmpeg om den inte redan är redo
            if (!ffmpeg.isLoaded()) {
                await ffmpeg.load();
            }

            statusText.innerText = "Bearbetar...";
            
            // Skriv in filen i minnet
            ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));

            // Kör FFmpeg
            await ffmpeg.run('-i', 'input.mp4', '-c', 'copy', 'output.mp4');

            // Läs ut resultatet
            const data = ffmpeg.FS('readFile', 'output.mp4');
            
            // Patcha
            const patched = window.KryptonMp4Patcher.patchKryptonContainer(data);
            
            // Skapa URL
            const url = URL.createObjectURL(new Blob([patched], { type: 'video/mp4' }));
            
            statusText.innerText = "Klar!";
            
            // Nedladdning
            const a = document.createElement('a');
            a.href = url;
            a.download = 'krypton_fixed.mp4';
            a.click();

        } catch (err) {
            console.error("FFmpeg runtime error:", err);
            // Om vi får atob-fel beror det nästan alltid på att 
            // .wasm-filen inte serveras korrekt (t.ex. som text/html)
            statusText.innerText = "Error: " + err.message;
        }
    });
});
