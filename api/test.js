// api/test.js
export default async function handler(req, res) {
  res.status(200).json({ ok: true, message: 'Collage API works' });
}
