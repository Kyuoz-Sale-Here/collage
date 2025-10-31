import Jimp from 'jimp';

/**
 * API Endpoint สำหรับสร้าง collage
 * วิธีใช้:
 * POST /api/collage
 * body: { "imageUrls": ["https://...jpg", "https://...jpg", ...] }
 */
export default async function handler(req, res) {
  try {
    const { imageUrls } = req.body;

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ error: 'กรุณาส่ง imageUrls เป็น array ของ URL รูปภาพ' });
    }

    const layout = [
      { x: 0, y: -300, w: 1000, h: 1600 },
      { x: 950, y: 0, w: 600, h: 500 },
      { x: 950, y: 500, w: 600, h: 500 },
      { x: -50, y: 1000, w: 600, h: 500 },
      { x: 450, y: 1000, w: 600, h: 500 },
      { x: 950, y: 1000, w: 600, h: 500 },
    ];

    const TARGET_WIDTH = 1500;
    const TARGET_HEIGHT = 1500;

    console.log('🖼️ กำลังโหลดภาพจาก URL...');
    const loaded = await Promise.all(imageUrls.map((url) => Jimp.read(url)));
    const collage = await Jimp.create(TARGET_WIDTH, TARGET_HEIGHT, 0xffffffff);

    for (let i = 0; i < layout.length && i < loaded.length; i++) {
      const { x, y, w, h } = layout[i];
      const img = loaded[i];
      img.scaleToFit(w, h);

      const offsetX = x + (w - img.bitmap.width) / 2;
      const offsetY = y + (h - img.bitmap.height) / 2;

      collage.composite(img, offsetX, offsetY);
    }

    // ส่งออกเป็น buffer (ไม่ต้องเขียนลงไฟล์)
    const buffer = await collage.getBufferAsync(Jimp.MIME_JPEG);
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้าง collage', detail: error.message });
  }
}
