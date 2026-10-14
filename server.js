const express = require("express");
const helmet = require("helmet");
const crypto = require("node:crypto");
const path = require("node:path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MAX_BYTES = 1024 * 1024;

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));
app.use(express.json({ limit: "1mb", strict: true }));
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ["html"],
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
}));

function validateInputs(req, res) {
  const { content, password } = req.body || {};
  if (typeof content !== "string" || !content.length) {
    res.status(400).json({ error: "Masukkan kode atau data terlebih dahulu." });
    return null;
  }
  if (Buffer.byteLength(content, "utf8") > MAX_BYTES) {
    res.status(413).json({ error: "Ukuran input maksimal 1 MB." });
    return null;
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 256) {
    res.status(400).json({ error: "Password harus 8–256 karakter." });
    return null;
  }
  return { content, password };
}

function deriveKey(password, salt) {
  return crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
}

app.post("/api/encrypt", (req, res) => {
  const input = validateInputs(req, res);
  if (!input) return;
  try {
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = deriveKey(input.password, salt);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
      cipher.update(input.content, "utf8"),
      cipher.final()
    ]);
    const payload = {
      format: "FOUR-NEIGHT-ENC",
      version: 1,
      kdf: "scrypt",
      cipher: "aes-256-gcm",
      salt: salt.toString("base64"),
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      data: encrypted.toString("base64")
    };
    res.json({ result: JSON.stringify(payload, null, 2), filename: "four-neight.enc.json" });
  } catch {
    res.status(500).json({ error: "Enkripsi gagal. Coba lagi." });
  }
});

app.post("/api/decrypt", (req, res) => {
  const input = validateInputs(req, res);
  if (!input) return;
  try {
    const payload = JSON.parse(input.content);
    if (
      payload.format !== "FOUR-NEIGHT-ENC" ||
      payload.version !== 1 ||
      payload.cipher !== "aes-256-gcm" ||
      payload.kdf !== "scrypt"
    ) {
      return res.status(400).json({ error: "Format file ENC tidak dikenali." });
    }
    const salt = Buffer.from(payload.salt, "base64");
    const iv = Buffer.from(payload.iv, "base64");
    const tag = Buffer.from(payload.tag, "base64");
    const encrypted = Buffer.from(payload.data, "base64");
    if (salt.length !== 16 || iv.length !== 12 || tag.length !== 16 || encrypted.length > MAX_BYTES) {
      return res.status(400).json({ error: "Data ENC tidak valid atau terlalu besar." });
    }
    const key = deriveKey(input.password, salt);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    res.json({ result: decrypted, filename: "decrypted.js" });
  } catch {
    res.status(400).json({ error: "Dekripsi gagal. Password salah atau file ENC rusak." });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok", app: "FOUR NEIGHT ENC" }));

app.use((err, _req, res, _next) => {
  if (err && err.type === "entity.too.large") {
    return res.status(413).json({ error: "Ukuran input terlalu besar." });
  }
  res.status(400).json({ error: "Permintaan tidak valid." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`FOUR NEIGHT ENC listening on port ${PORT}`);
});
