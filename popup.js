document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("drop-zone");
  const browseBtn = document.getElementById("browse-btn");
  const fileInput = document.getElementById("file-input");
  const processingState = document.getElementById("processing-state");
  const statusText = document.getElementById("status-text");
  const progressBar = document.getElementById("progress-bar");
  const successState = document.getElementById("success-state");

  const { FFmpeg } = window.FFmpegWASM || {};
  const ffmpeg = FFmpeg ? new FFmpeg() : null;

  ffmpeg?.on("progress", ({ progress }) => {
    progressBar.style.width = `${Math.round(progress * 100)}%`;
  });

  async function handleFile(file) {
    processingState.classList.remove("hidden");
    statusText.innerText = "Initializing...";

    try {
      if (!ffmpeg.loaded) {
        await ffmpeg.load({
          coreURL: "ffmpeg/ffmpeg-core.js",
          wasmURL: "ffmpeg/ffmpeg-core.wasm",
        });
      }

      const inputBytes = new Uint8Array(await file.arrayBuffer());
      await ffmpeg.writeFile("input.mp4", inputBytes);

      // VIKTIGT: Inga metadata-flaggor här som triggar TikTok
      // Vi kör en ren omkodning till H.264 High Profile
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
      
      // Använd din patcher för att fixa containern efteråt
      const outputBytes = window.KryptonMp4Patcher.patchKryptonContainer(remuxedBytes);
      
      const blob = new Blob([outputBytes], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);

      processingState.classList.add("hidden");
      successState.classList.remove("hidden");
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `krypton_${file.name}`;
      a.click();

    } catch (error) {
      console.error(error);
      statusText.innerText = "Error occurred.";
    }
  }

  browseBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => e.target.files[0] && handleFile(e.target.files[0]));
});
