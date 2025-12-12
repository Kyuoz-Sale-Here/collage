import Jimp from "jimp";

export default async function handler(req, res) {
  try {
    const { images } = req.query;

    if (!images) {
      return res.status(400).json({ error: "Missing 'images' parameter" });
    }

    // แปลง parameter ?images=...,... เป็น array
    const urls = images.split(",");

    // โหลดภาพทั้งหมดจาก URL
    const loaded = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        return Jimp.read(buffer);
      })
    );

    // 🔧 ปรับขนาด Output ได้อิสระ
    const TARGET_WIDTH = 1500;   // ความกว้างของภาพสุดท้าย
    const TARGET_HEIGHT = 800;  // ความสูงของภาพสุดท้าย

    // Layout แบบแนวนอน 2 รูป
    const COLS = 2;
    const ROWS = 1;
    const MARGIN = 0;

    const totalMarginX = (COLS + 1) * MARGIN;
    const totalMarginY = (ROWS + 1) * MARGIN;

    const CELL_WIDTH = (TARGET_WIDTH - totalMarginX) / COLS;
    const CELL_HEIGHT = (TARGET_HEIGHT - totalMarginY) / ROWS;

    // สร้างพื้นหลังขนาดใหม่ (สีขาว)
    const collage = await Jimp.create(TARGET_WIDTH, TARGET_HEIGHT, 0xffffffff);

    // ใส่ภาพลงใน grid
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

    // ส่งออก JPEG
    const buffer = await collage.getBufferAsync(Jimp.MIME_JPEG);
    res.setHeader("Content-Type", "image/jpeg");
    res.send(buffer);
  } catch (err) {
    console.error("❌ Error generating collage:", err);
    res.status(500).json({ error: err.message });
  }
}
