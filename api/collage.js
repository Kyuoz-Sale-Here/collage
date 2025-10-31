import Jimp from "jimp";

export default async function handler(req, res) {
  try {
    // ✅ รับ URL ของภาพจาก query เช่น ?images=url1,url2,url3,url4
    const urls = req.query.images?.split(",");
    if (!urls || urls.length === 0) {
      return res.status(400).json({ error: "กรุณาใส่พารามิเตอร์ images ใน query เช่น ?images=url1,url2" });
    }

    const COLS = 2;
    const ROWS = 2;
    const TARGET_SIZE = 1500;
    const MARGIN = 0;

    const totalMarginX = (COLS + 1) * MARGIN;
    const totalMarginY = (ROWS + 1) * MARGIN;
    const CELL_WIDTH = (TARGET_SIZE - totalMarginX) / COLS;
    const CELL_HEIGHT = (TARGET_SIZE - totalMarginY) / ROWS;

    console.log("🖼️ กำลังโหลดภาพ...");
    const loaded = await Promise.all(urls.map((url) => Jimp.read(url)));

    const collage = await Jimp.create(TARGET_SIZE, TARGET_SIZE, 0xffffffff);

    for (let i = 0; i < loaded.length; i++) {
      const img = loaded[i];
      img.scaleToFit(CELL_WIDTH, CELL_HEIGHT);

      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = MARGIN + col * (CELL_WIDTH + MARGIN);
      const y = MARGIN + row * (CELL_HEIGHT + MARGIN);

      const offsetX = x + (CELL_WIDTH - img.bitmap.width) / 2;
      const offsetY = y + (CELL_HEIGHT - img.bitmap.height) / 2;

      collage.composite(img, offsetX, offsetY);
    }

    const buffer = await collage.getBufferAsync(Jimp.MIME_JPEG);
    res.setHeader("Content-Type", "image/jpeg");
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
