const { createFFmpeg, fetchFile } = FFmpeg;

// Initiera
const ffmpeg = createFFmpeg({ 
  corePath: `${window.location.origin}/ffmpeg/ffmpeg-core.js`,
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

        console.log("Fil vald:", file.name);
        statusText.innerText = "Laddar motor...";

        try {
            // 1. Ladda FFmpeg
            if (!ffmpeg.isLoaded()) {
                await ffmpeg.load();
                console.log("FFmpeg laddad!");
            }

            // 2. Skriv fil
            statusText.innerText = "Läser in fil...";
            ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));
            console.log("Fil skriven till FS");

            // 3. Kör FFmpeg
            statusText.innerText = "Bearbetar (detta kan ta några sekunder)...";
            await ffmpeg.run('-i', 'input.mp4', '-c', 'copy', 'output.mp4');
            console.log("FFmpeg körning klar");

            // 4. Läs ut
            const data = ffmpeg.FS('readFile', 'output.mp4');
            console.log("Fil läst från FS, storlek:", data.length);
            
            // 5. Patcha
            const patched = window.KryptonMp4Patcher.patchKryptonContainer(data);
            const url = URL.createObjectURL(new Blob([patched], { type: 'video/mp4' }));
            
            statusText.innerText = "Klar! Laddar ner...";
            const a = document.createElement('a');
            a.href = url;
            a.download = 'krypton_fixed.mp4';
            a.click();

        } catch (err) {
            console.error("FEL I PROSESSEN:", err);
            statusText.innerText = "Error: " + err.message;
        }
    });
});
