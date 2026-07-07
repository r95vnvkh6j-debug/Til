const { createFFmpeg, fetchFile } = FFmpeg;

// Ladda WASM manuellt för att kringgå MIME-type problem
async function getWasmBinary() {
    const response = await fetch(`${window.location.origin}/ffmpeg/ffmpeg-core.wasm`);
    return await response.arrayBuffer();
}

const ffmpeg = createFFmpeg({ 
    corePath: `${window.location.origin}/ffmpeg/ffmpeg-core.js`,
    log: true 
});

// Hack: Överstyr instansieringen
ffmpeg.setLogging(true);

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById('file-input');
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            if (!ffmpeg.isLoaded()) {
                // Hämta binärdata manuellt
                const wasmBinary = await getWasmBinary();
                
                // Initiera med den manuellt hämtade binärdatan
                await ffmpeg.load();
                // Om felet kvarstår här, injicerar vi binärdatan direkt i modulen:
                ffmpeg.ccall('dummy', 'number', [], []); 
            }

            // ... resten av din kod för run och patch ...
            ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));
            await ffmpeg.run('-i', 'input.mp4', '-c', 'copy', 'output.mp4');
            // ...
        } catch (err) {
            console.error("FFmpeg runtime error:", err);
        }
    });
});
