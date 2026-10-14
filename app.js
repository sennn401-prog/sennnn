const source = document.getElementById("source");
const password = document.getElementById("password");
const result = document.getElementById("result");
const message = document.getElementById("message");
const status = document.getElementById("resultStatus");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");
let outputFilename = "four-neight.enc.json";

document.getElementById("year").textContent = new Date().getFullYear();
source.addEventListener("input", () => {
  document.getElementById("charCount").textContent = `${source.value.length.toLocaleString()} characters`;
});

document.getElementById("togglePassword").addEventListener("click", (event) => {
  password.type = password.type === "password" ? "text" : "password";
  event.currentTarget.textContent = password.type === "password" ? "SHOW" : "HIDE";
});

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}
function setBusy(busy) {
  document.getElementById("encryptBtn").disabled = busy;
  document.getElementById("decryptBtn").disabled = busy;
}
async function processData(action) {
  setMessage("");
  const content = source.value;
  const pass = password.value;
  if (!content.trim()) return setMessage("Masukkan kode atau isi file ENC terlebih dahulu.", true);
  if (pass.length < 8) return setMessage("Password minimal 8 karakter.", true);
  if (new TextEncoder().encode(content).length > 1024 * 1024) return setMessage("Input maksimal 1 MB.", true);

  setBusy(true);
  status.textContent = "PROCESSING";
  try {
    const response = await fetch(`/api/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, password: pass })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Permintaan gagal.");
    result.value = data.result;
    outputFilename = data.filename || "four-neight-result.txt";
    downloadBtn.disabled = false;
    copyBtn.disabled = false;
    status.textContent = "COMPLETE";
    setMessage(action === "encrypt" ? "Enkripsi berhasil. Simpan file dan ingat password lu." : "Dekripsi berhasil. Source sudah tersedia di output.");
  } catch (error) {
    status.textContent = "ERROR";
    setMessage(error.message || "Terjadi kesalahan.", true);
  } finally {
    setBusy(false);
  }
}
document.getElementById("encryptBtn").addEventListener("click", () => processData("encrypt"));
document.getElementById("decryptBtn").addEventListener("click", () => processData("decrypt"));
downloadBtn.addEventListener("click", () => {
  if (!result.value) return;
  const blob = new Blob([result.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = outputFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(result.value);
    setMessage("Result berhasil disalin.");
  } catch {
    result.focus();
    result.select();
    setMessage("Pilih teks output lalu salin secara manual.", true);
  }
});