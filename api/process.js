import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import busboy from 'busboy';
import fs from 'fs';
import path from 'path';

// Sätt sökvägen till FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const bb = busboy({ headers: req.headers });
  const tmpPath = path.join('/tmp', `input-${Date.now()}.mp4`);
  const outPath = path.join('/tmp', `output-${Date.now()}.mp4`);

  bb.on('file', (_, file) => {
    file.pipe(fs.createWriteStream(tmpPath));
  });

  bb.on('finish', () => {
    ffmpeg(tmpPath)
      .outputOptions('-c:v libx264', '-crf 23', '-preset medium')
      .save(outPath)
      .on('end', () => {
        const stream = fs.createReadStream(outPath);
        res.setHeader('Content-Type', 'video/mp4');
        stream.pipe(res);
      })
      .on('error', (err) => {
        console.error("FFMPEG ERROR:", err); // Detta syns i Vercel-loggen
        res.status(500).send("FFmpeg failed: " + err.message);
      });
  });

  req.on('error', (err) => res.status(500).send("Request error: " + err.message));
  req.pipe(bb);
}
