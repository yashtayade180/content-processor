require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const multer         = require('multer');
const path           = require('path');
const fs             = require('fs');
const os             = require('os');
const { processWord } = require('./content-processor');

const app  = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 64 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.originalname.endsWith('.docx')
      ? cb(null, true)
      : cb(new Error('Only .docx files are accepted'));
  },
});

app.post(
  '/api/process',
  upload.fields([{ name: 'source', maxCount: 1 }, { name: 'target', maxCount: 1 }]),
  async (req, res) => {
    const sourceFile = req.files?.source?.[0];
    const targetFile = req.files?.target?.[0];

    if (!sourceFile || !targetFile) {
      return res.status(400).json({ error: 'Both source and target .docx files are required.' });
    }

    const outputPath  = path.join(os.tmpdir(), `processed_${Date.now()}.docx`);
    const toClean     = [sourceFile.path, targetFile.path, outputPath];
    const cleanup     = () => toClean.forEach(f => fs.unlink(f, () => {}));

    try {
      await processWord(sourceFile.path, targetFile.path, outputPath, {
        debug:         false,
        reverse:       req.body.reverse === 'true',
        'min-slot':    parseInt(req.body.minSlot,    10) || 100,
        'min-section': parseInt(req.body.minSection, 10) || 200,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="processed_${targetFile.originalname}"`);
      res.sendFile(outputPath, { root: '/' }, (err) => {
        cleanup();
        if (err && !res.headersSent) res.status(500).json({ error: err.message });
      });
    } catch (err) {
      cleanup();
      res.status(500).json({ error: err.message });
    }
  }
);

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
