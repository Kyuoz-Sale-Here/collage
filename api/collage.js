import Jimp from "jimp";

export default async function handler(req, res) {
  try {
    const { images } = req.query;

    if (!images) {
      return res.status(400).json({ error: "Missing 'images' parameter" });
    }

    // ✅ แยกลิงก์ภาพเป็น array
    const urls = images.split(",");

    // ✅ โหลดภาพทั้งหมดจาก URL
    const loaded = await Promise.all(urls.map((url) => Jimp.read(url)));

    // ✅ กำหนด layout (2x2 grid)
    const COLS = 2;
    const ROWS = 2;
    const SIZE = 1500;
    const collage = await Jimp.create(SIZE, SIZE, 0xffffffff);

    const CELL_W = SIZE / COLS;
    const CELL_H = SIZE / ROWS;

    for (let i = 0; i < loaded.length; i++) {
      const img = loaded[i];
      img.scaleToFit(CELL_W, CELL_H);

      const x = (i % COLS) * CELL_W;
      const y = Math.floor(i / COLS) * CELL_H;
      collage.composite(img, x, y);
    }

    // ✅ แปลงเป็น Buffer แล้วส่งกลับ
    const buffer = await collage.getBufferAsync(Jimp.MIME_JPEG);
    res.setHeader("Content-Type", "image/jpeg");
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
