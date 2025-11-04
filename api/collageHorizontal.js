import Jimp from "jimp";

export default async function handler(req, res) {
  try {
    const { images } = req.query;

    if (!images) {
      return res.status(400).json({ error: "Missing 'images' parameter" });
    }

    // ✅ แปลง parameter ?images=url1,url2,... เป็น array
    const urls = images.split(",");

    console.log("🖼️ กำลังโหลดภาพจาก URL ทั้งหมด...");

    // ✅ โหลดภาพทั้งหมดจาก URL (fetch → buffer → Jimp)
    const loaded = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        return Jimp.read(buffer);
      })
    );

    // ✅ layout แนวนอน
    const layout = [
      { x: -250, y: 0, w: 2000, h: 1000 }, // ภาพใหญ่ด้านบน
      { x: -50, y: 1000, w: 600, h: 500 },
      { x: 450, y: 1000, w: 600, h: 500 },
      { x: 950, y: 1000, w: 600, h: 500 },
    ];

    const TARGET_WIDTH = 1500;
    const TARGET_HEIGHT = 1500;

    // ✅ สร้างพื้นหลังสีขาว
    const collage = await Jimp.create(TARGET_WIDTH, TARGET_HEIGHT, 0xffffffff);

    // ✅ วางแต่ละภาพตาม layout
    for (let i = 0; i < layout.length && i < loaded.length; i++) {
      const { x, y, w, h } = layout[i];
      const img = loaded[i];

      img.scaleToFit(w, h);

      const offsetX = x + (w - img.bitmap.width) / 2;
      const offsetY = y + (h - img.bitmap.height) / 2;

      collage.composite(img, offsetX, offsetY);
    }

    // ✅ แปลงเป็น JPEG แล้วส่งกลับ
    const buffer = await collage.getBufferAsync(Jimp.MIME_JPEG);
    res.setHeader("Content-Type", "image/jpeg");
    res.send(buffer);
  } catch (err) {
    console.error("❌ Error generating collage:", err);
    res.status(500).json({ error: err.message });
  }
}
