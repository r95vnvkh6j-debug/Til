const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const Busboy = require('busboy');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const busboy = Busboy({ headers: req.headers });
  const uploadPath = path.join('/tmp', 'input.mp4');
  const outputPath = path.join('/tmp', 'output.mp4');

  busboy.on('file', (fieldname, file) => {
    const saveTo = fs.createWriteStream(uploadPath);
    file.pipe(saveTo);
  });

  busboy.on('finish', () => {
    ffmpeg(uploadPath)
      .outputOptions('-c:v libx264')
      .save(outputPath)
      .on('end', () => {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', 'attachment; filename=patched.mp4');
        const readStream = fs.createReadStream(outputPath);
        readStream.pipe(res);
      })
      .on('error', (err) => {
        res.status(500).send('FFmpeg error: ' + err.message);
      });
  });

  req.pipe(busboy);
}
