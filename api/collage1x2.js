import Jimp from "jimp";

export default async function handler(req, res) {
  try {
    const { images } = req.query;

    if (!images) {
      return res.status(400).json({ error: "Missing 'images' parameter" });
    }

    // ✅ แปลง parameter ?images=...,... เป็น array
    const urls = images.split(",");

    // ✅ โหลดภาพทั้งหมดจาก URL (ใช้ fetch เพื่อความปลอดภัย)
    const loaded = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        return Jimp.read(buffer);
      })
    );

    // ✅ กำหนด layout แบบแนวนอน (2 รูป)
    const COLS = 2;
    const ROWS = 1;
    const TARGET_SIZE = 1500;
    const MARGIN = 0;

    const totalMarginX = (COLS + 1) * MARGIN;
    const totalMarginY = (ROWS + 1) * MARGIN;
    const CELL_WIDTH = (TARGET_SIZE - totalMarginX) / COLS;
    const CELL_HEIGHT = (TARGET_SIZE - totalMarginY) / ROWS;

    // ✅ พื้นหลังสีขาว
    const collage = await Jimp.create(TARGET_SIZE, TARGET_SIZE, 0xffffffff);

    // ✅ วนใส่ภาพใน grid
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

    // ✅ ส่งออกเป็น JPEG buffer
    const buffer = await collage.getBufferAsync(Jimp.MIME_JPEG);
    res.setHeader("Content-Type", "image/jpeg");
    res.send(buffer);
  } catch (err) {
    console.error("❌ Error generating collage:", err);
    res.status(500).json({ error: err.message });
  }
}
