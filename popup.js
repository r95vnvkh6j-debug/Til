document.addEventListener("DOMContentLoaded", () => {
  const browseBtn = document.getElementById("browse-btn");
  const fileInput = document.getElementById("file-input");
  const statusText = document.getElementById("status-text");
  const progressBar = document.getElementById("progress-bar");
  const processingState = document.getElementById("processing-state");
  const successState = document.getElementById("success-state");
  const downloadBtn = document.getElementById("download-btn");

  const { FFmpeg } = FFmpegWASM;
  const ffmpeg = new FFmpeg();

  ffmpeg.on("progress", ({ progress }) => {
    progressBar.style.width = `${Math.round(progress * 100)}%`;
  });

  browseBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    processingState.classList.remove("hidden");
    statusText.innerText = "Laddar motor...";

    try {
      if (!ffmpeg.loaded) {
        await ffmpeg.load({
          coreURL: "/ffmpeg/ffmpeg-core.js",
          wasmURL: "/ffmpeg/ffmpeg-core.wasm",
        });
      }

      await ffmpeg.writeFile("input.mp4", await file.arrayBuffer());

      statusText.innerText = "Bearbetar...";
      await ffmpeg.exec([
        "-i", "input.mp4",
        "-c:v", "libx264", "-profile:v", "high", "-level", "4.2",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart",
        "output.mp4"
      ]);

      const remuxedBytes = await ffmpeg.readFile("output.mp4");
      // Patcha containern med din funktion
      const outputBytes = window.KryptonMp4Patcher.patchKryptonContainer(remuxedBytes);
      
      const blob = new Blob([outputBytes], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      
      processingState.classList.add("hidden");
      successState.classList.remove("hidden");
      
      downloadBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = url;
        a.download = "krypton_fixed.mp4";
        a.click();
      };
    } catch (err) {
      statusText.innerText = "Fel: " + err.message;
      console.error(err);
    }
  });
});
