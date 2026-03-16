const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const YTDLP = 'yt-dlp';

// Get video info and available formats
app.post('/api/info', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const args = [
    '--dump-json',
    '--no-playlist',
    url
  ];

  let output = '';
  let errorOutput = '';
  const proc = spawn(YTDLP, args);

  proc.stdout.on('data', (data) => { output += data.toString(); });
  proc.stderr.on('data', (data) => { errorOutput += data.toString(); });

  proc.on('close', (code) => {
    if (code !== 0) {
      return res.status(400).json({ error: 'Could not fetch video info. Make sure the URL is valid and supported.' });
    }
    try {
      const info = JSON.parse(output);
      const formats = [];

      // Video+audio formats
      const videoFormats = (info.formats || []).filter(f =>
        f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none' && f.ext
      );

      // Add best video options by resolution
      const seen = new Set();
      videoFormats.forEach(f => {
        const label = `${f.height || '?'}p ${f.ext.toUpperCase()}`;
        if (!seen.has(label) && f.height) {
          seen.add(label);
          formats.push({
            id: f.format_id,
            label,
            type: 'video',
            height: f.height,
            ext: f.ext,
            filesize: f.filesize || f.filesize_approx || null
          });
        }
      });

      // Sort by resolution descending
      formats.sort((a, b) => (b.height || 0) - (a.height || 0));

      // Add audio-only option
      const audioFormats = (info.formats || []).filter(f =>
        (f.vcodec === 'none' || !f.vcodec) && f.acodec && f.acodec !== 'none'
      );
      if (audioFormats.length > 0) {
        formats.push({ id: 'bestaudio', label: 'Audio only (MP3)', type: 'audio', ext: 'mp3' });
      }

      // Fallback: if no merged formats, offer best quality
      if (formats.length === 0) {
        formats.push({ id: 'best', label: 'Best quality', type: 'video', ext: 'mp4' });
        formats.push({ id: 'bestaudio', label: 'Audio only (MP3)', type: 'audio', ext: 'mp3' });
      }

      res.json({
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        uploader: info.uploader,
        formats
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse video info' });
    }
  });
});

// Download and stream file to client
app.post('/api/download', (req, res) => {
  const { url, formatId, type, ext } = req.body;
  if (!url || !formatId) return res.status(400).json({ error: 'URL and format are required' });

  const tmpFile = path.join(os.tmpdir(), `media_${Date.now()}.%(ext)s`);

  const args = type === 'audio'
    ? ['-x', '--audio-format', 'mp3', '-o', tmpFile, '--no-playlist', url]
    : ['-f', formatId, '-o', tmpFile, '--no-playlist', '--merge-output-format', 'mp4', url];

  let errorOutput = '';
  const proc = spawn(YTDLP, args);
  proc.stderr.on('data', (d) => { errorOutput += d.toString(); });

  proc.on('close', (code) => {
    if (code !== 0) {
      console.error('yt-dlp error:', errorOutput);
      return res.status(500).json({ error: 'Download failed. The format may not be available.' });
    }

    // Find the actual output file
    const dir = path.dirname(tmpFile);
    const base = path.basename(tmpFile, '.%(ext)s');
    const files = fs.readdirSync(dir).filter(f => f.startsWith(base));

    if (files.length === 0) return res.status(500).json({ error: 'Downloaded file not found' });

    const filePath = path.join(dir, files[0]);
    const fileExt = path.extname(filePath).slice(1);
    const mimeType = fileExt === 'mp3' ? 'audio/mpeg' : 'video/mp4';

    res.setHeader('Content-Disposition', `attachment; filename="download.${fileExt}"`);
    res.setHeader('Content-Type', mimeType);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('end', () => {
      fs.unlink(filePath, () => {});
    });
    stream.on('error', () => {
      fs.unlink(filePath, () => {});
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Media Downloader running at http://localhost:${PORT}`));
