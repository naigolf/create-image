const express = require('express');
const axios = require('axios');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = process.env.PORT || 3000;

app.use('/edited', express.static('edited'));

app.get('/edit', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send("Missing ?url");

  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');
    const image = await loadImage(imageBuffer);

    const width = image.width;
    const height = image.height;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw image
    ctx.drawImage(image, 0, 0, width, height);

    // Red border
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'red';
    ctx.strokeRect(0, 0, width, height);

    // Black box with yellow text "59.-"
    const boxWidth = 100;
    const boxHeight = 50;
    ctx.fillStyle = 'black';
    ctx.fillRect(width - boxWidth - 20, height - boxHeight - 20, boxWidth, boxHeight);

    ctx.fillStyle = 'yellow';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('59.-', width - boxWidth + 10 - 20, height - 20);

    // Save and return URL
    const filename = uuidv4() + '.jpg';
    const filepath = `edited/${filename}`;
    fs.mkdirSync('edited', { recursive: true });

    const out = fs.createWriteStream(filepath);
    const stream = canvas.createJPEGStream();
    stream.pipe(out);
    out.on('finish', () => {
      res.json({
        status: 'success',
        url: `${req.protocol}://${req.get('host')}/edited/${filename}`
      });
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to process image");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
