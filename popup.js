const { createFFmpeg, fetchFile } = FFmpeg;

// Vi definierar bas-URL:en för att vara säkra på att vi pekar rätt
const baseUrl = window.location.origin;

const ffmpeg = createFFmpeg({ 
  corePath: `${baseUrl}/ffmpeg/ffmpeg-core.js`,
  // locateFile mappar om alla interna anrop till din /ffmpeg/-mapp
  locateFile: (path, prefix) => {
    return `${baseUrl}/ffmpeg/${path}`;
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
            // Ladda motorn om den inte är redo
            if (!ffmpeg.isLoaded()) {
                await ffmpeg.load();
            }

            statusText.innerText = "Bearbetar...";
            
            // 1. Skriv in filen i minnet
            ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));

            // 2. Kör FFmpeg-kommandot
            await ffmpeg.run('-i', 'input.mp4', '-c', 'copy', 'output.mp4');

            // 3. Läs ut resultatet från minnet
            const data = ffmpeg.FS('readFile', 'output.mp4');
            
            // 4. Utför din patchning (förutsätter att KryptonMp4Patcher finns globalt)
            const patched = window.KryptonMp4Patcher.patchKryptonContainer(data);
            
            // 5. Skapa nedladdningslänk
            const url = URL.createObjectURL(new Blob([patched], { type: 'video/mp4' }));
            
            statusText.innerText = "Klar!";
            const a = document.createElement('a');
            a.href = url;
            a.download = 'krypton_fixed.mp4';
            a.click();

        } catch (err) {
            console.error("FFmpeg runtime error:", err);
            statusText.innerText = "Error: " + err.message;
        }
    });
});
