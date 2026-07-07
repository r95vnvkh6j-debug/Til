document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("drop-zone");
  const browseBtn = document.getElementById("browse-btn");
  const fileInput = document.getElementById("file-input");
  const statusText = document.getElementById("status-text");

  // Kontrollera att FFmpeg är definierat
  if (!window.FFmpegWASM) {
    statusText.innerText = "Error: FFmpeg library not loaded.";
    return;
  }

  const { FFmpeg } = window.FFmpegWASM;
  const ffmpeg = new FFmpeg();

  ffmpeg.on("progress", ({ progress }) => {
    statusText.innerText = `Processing: ${Math.round(progress * 100)}%`;
  });

  async function handleFile(file) {
    statusText.innerText = "Loading engine...";
    
    try {
      if (!ffmpeg.loaded) {
        await ffmpeg.load({
          coreURL: "ffmpeg/ffmpeg-core.js",
          wasmURL: "ffmpeg/ffmpeg-core.wasm",
        });
      }

      statusText.innerText = "Reading file...";
      const inputBytes = new Uint8Array(await file.arrayBuffer());
      await ffmpeg.writeFile("input.mp4", inputBytes);

      statusText.innerText = "Processing...";
      await ffmpeg.exec([
        "-i", "input.mp4",
        "-c:v", "libx264",
        "-profile:v", "high",
        "-level", "4.2",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-movflags", "+faststart",
        "output.mp4"
      ]);

      const remuxedBytes = await ffmpeg.readFile("output.mp4");
      
      // Patcha containern för att lura TikTok
      const outputBytes = window.KryptonMp4Patcher.patchKryptonContainer(remuxedBytes);
      
      const blob = new Blob([outputBytes], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      
      statusText.innerText = "Done!";
      const a = document.createElement('a');
      a.href = url;
      a.download = `krypton_${file.name}`;
      a.click();
    } catch (error) {
      console.error(error);
      statusText.innerText = "Error: " + error.message;
    }
  }

  browseBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => e.target.files[0] && handleFile(e.target.files[0]));
});
