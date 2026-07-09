const fs   = require("fs");
const path = require("path");
const { Message } = require("./src/models/chat.models");
const env  = require("./src/config/env");
const { upload } = require("./src/middleware/upload.middleware");
const router = require("./src/routes/upload.routes");

let p = 0, f = 0;
function t(name, fn) {
  try { fn(); console.log("PASS", name); p++; }
  catch (e) { console.log("FAIL", name, "-", e.message); f++; }
}
const read = (rel) => fs.readFileSync(path.join(__dirname, rel), "utf8");

const routes = router.stack.filter(l => l.route)
  .map(l => ({ m: Object.keys(l.route.methods)[0].toUpperCase(), p: l.route.path }));

console.log("\n=== MODULE 6: File & Media Sharing ===\n");

// ── Multer Middleware ─────────────────────────────────────────
t("[Multer] upload object exported",            () => { if (!upload || typeof upload.single !== "function") throw new Error("upload.single missing"); });
t("[Multer] upload.array exists",               () => { if (typeof upload.array !== "function") throw new Error(); });
t("[Multer] max file size from env",            () => { if (env.MAX_FILE_SIZE_BYTES !== 5 * 1024 * 1024) throw new Error(`got ${env.MAX_FILE_SIZE_BYTES}`); });
t("[Multer] UPLOAD_DIR created on startup",     () => { if (!fs.existsSync(env.UPLOAD_DIR)) throw new Error("dir missing"); });
t("[Multer] disk storage strategy",             () => {
  const src = read("./src/middleware/upload.middleware.js");
  if (!src.includes("diskStorage")) throw new Error("not diskStorage");
});
t("[Multer] filename sanitised (no special chars)", () => {
  const src = read("./src/middleware/upload.middleware.js");
  if (!src.includes("replace") || !src.includes("[^a-z0-9")) throw new Error("no sanitisation");
});
t("[Multer] timestamp prefix in filename",      () => { if (!read("./src/middleware/upload.middleware.js").includes("Date.now()")) throw new Error(); });
t("[Multer] random suffix in filename",         () => { if (!read("./src/middleware/upload.middleware.js").includes("Math.random()")) throw new Error(); });

// ── Upload Routes ─────────────────────────────────────────────
t("[Routes] POST / exists",                     () => { if (!routes.find(r => r.m === "POST" && r.p === "/")) throw new Error(); });
t("[Routes] requireAuth on POST /",             () => {
  const src = read("./src/routes/upload.routes.js");
  if (!src.includes("requireAuth")) throw new Error("not protected");
});
t("[Routes] multer single('file') middleware",  () => {
  const src = read("./src/routes/upload.routes.js");
  if (!src.includes("upload.single") || !src.includes("\"file\"")) throw new Error();
});

// ── Upload Controller ─────────────────────────────────────────
t("[Controller] returns fileName",              () => { if (!read("./src/controllers/upload.controller.js").includes("fileName")) throw new Error(); });
t("[Controller] returns fileUrl",               () => { if (!read("./src/controllers/upload.controller.js").includes("fileUrl")) throw new Error(); });
t("[Controller] returns fileSize",              () => { if (!read("./src/controllers/upload.controller.js").includes("fileSize")) throw new Error(); });
t("[Controller] returns mimeType",              () => { if (!read("./src/controllers/upload.controller.js").includes("mimeType")) throw new Error(); });
t("[Controller] 400 if no file",                () => { if (!read("./src/controllers/upload.controller.js").includes("400")) throw new Error(); });
t("[Controller] URL uses API_BASE_URL",         () => { if (!read("./src/controllers/upload.controller.js").includes("API_BASE_URL")) throw new Error(); });
t("[Controller] path.basename used",            () => { if (!read("./src/controllers/upload.controller.js").includes("path.basename")) throw new Error(); });
t("[Controller] status 201",                    () => { if (!read("./src/controllers/upload.controller.js").includes("201")) throw new Error(); });

// ── Message Model file fields ─────────────────────────────────
const msgPaths = Object.keys(Message.schema.paths);
t("[Model] fileName field",  () => { if (!msgPaths.includes("fileName"))  throw new Error(); });
t("[Model] fileUrl field",   () => { if (!msgPaths.includes("fileUrl"))   throw new Error(); });
t("[Model] fileSize field",  () => { if (!msgPaths.includes("fileSize"))  throw new Error(); });
t("[Model] mimeType field",  () => { if (!msgPaths.includes("mimeType"))  throw new Error(); });
t("[Model] messageType file in enum", () => {
  const e = Message.schema.path("messageType").enumValues;
  if (!e.includes("file")) throw new Error();
});
t("[Model] messageType audio in enum", () => {
  const e = Message.schema.path("messageType").enumValues;
  if (!e.includes("audio")) throw new Error();
});

// ── FileShare component ───────────────────────────────────────
const fs_comp = read("../client/src/components/FileShare.jsx");
t("[FileShare] drag-and-drop handlers",         () => { if (!fs_comp.includes("onDrop") || !fs_comp.includes("onDragOver")) throw new Error(); });
t("[FileShare] click-to-browse fallback",       () => { if (!fs_comp.includes("inputRef") || !fs_comp.includes("click()")) throw new Error(); });
t("[FileShare] ALLOWED_TYPES list",             () => { if (!fs_comp.includes("ALLOWED_TYPES")) throw new Error(); });
t("[FileShare] image types allowed",            () => { if (!fs_comp.includes("image/jpeg") || !fs_comp.includes("image/png")) throw new Error(); });
t("[FileShare] PDF allowed",                    () => { if (!fs_comp.includes("application/pdf")) throw new Error(); });
t("[FileShare] Word (.doc/.docx) allowed",      () => { if (!fs_comp.includes("msword") || !fs_comp.includes("wordprocessingml")) throw new Error(); });
t("[FileShare] Excel (.xls/.xlsx) allowed",     () => { if (!fs_comp.includes("ms-excel") || !fs_comp.includes("spreadsheetml")) throw new Error(); });
t("[FileShare] file size validation",           () => { if (!fs_comp.includes("MAX_BYTES") && !fs_comp.includes("maxSize")) throw new Error(); });
t("[FileShare] image preview before send",      () => { if (!fs_comp.includes("dataUrl") || !fs_comp.includes("FileReader")) throw new Error(); });
t("[FileShare] error message shown",            () => { if (!fs_comp.includes("setError")) throw new Error(); });
t("[FileShare] onFileSelect callback",          () => { if (!fs_comp.includes("onFileSelect")) throw new Error(); });
t("[FileShare] send/cancel buttons",            () => { if (!fs_comp.includes("Send File") || !fs_comp.includes("Cancel")) throw new Error(); });
t("[FileShare] disabled prop respected",        () => { if (!fs_comp.includes("disabled")) throw new Error(); });
t("[FileShare] keyboard accessible (Enter)",    () => { if (!fs_comp.includes("onKeyDown") || !fs_comp.includes("Enter")) throw new Error(); });
t("[FileShare] role=button on drop zone",       () => { if (!fs_comp.includes('role="button"')) throw new Error(); });

// ── VoiceRecorder component ───────────────────────────────────
const vr = read("../client/src/components/VoiceRecorder.jsx");
t("[VoiceRecorder] uses MediaRecorder API",     () => { if (!vr.includes("MediaRecorder")) throw new Error(); });
t("[VoiceRecorder] getUserMedia for audio",     () => { if (!vr.includes("getUserMedia") || !vr.includes("audio")) throw new Error(); });
t("[VoiceRecorder] idle/recording/preview states", () => { if (!vr.includes("idle") || !vr.includes("recording") || !vr.includes("preview")) throw new Error(); });
t("[VoiceRecorder] live duration timer",        () => { if (!vr.includes("setInterval") || !vr.includes("duration")) throw new Error(); });
t("[VoiceRecorder] formatDuration MM:SS",       () => { if (!vr.includes("formatDuration") || !vr.includes("padStart")) throw new Error(); });
t("[VoiceRecorder] webm/ogg codec detection",   () => { if (!vr.includes("isTypeSupported") || !vr.includes("webm")) throw new Error(); });
t("[VoiceRecorder] audio preview before send",  () => { if (!vr.includes("<audio") || !vr.includes("controls")) throw new Error(); });
t("[VoiceRecorder] send creates File object",   () => { if (!vr.includes("new File") || !vr.includes("audioBlob")) throw new Error(); });
t("[VoiceRecorder] discard releases ObjectURL", () => { if (!vr.includes("revokeObjectURL")) throw new Error(); });
t("[VoiceRecorder] microphone denied error",    () => { if (!vr.includes("Microphone access denied")) throw new Error(); });
t("[VoiceRecorder] cleanup on unmount",         () => { if (!vr.includes("clearInterval") || !vr.includes("getTracks")) throw new Error(); });
t("[VoiceRecorder] animated recording dot",     () => { if (!vr.includes("voice-recorder__dot")) throw new Error(); });
t("[VoiceRecorder] onSend callback",            () => { if (!vr.includes("onSend")) throw new Error(); });

// ── SharedMediaPanel component ────────────────────────────────
const smp = read("../client/src/components/SharedMediaPanel.jsx");
t("[SharedMedia] 6 tabs defined",              () => { const tabs = ["images","videos","documents","links","audio","gifs"]; tabs.forEach(tab => { if (!smp.includes(tab)) throw new Error(`missing ${tab}`); }); });
t("[SharedMedia] images tab — grid layout",    () => { if (!smp.includes("shared-media-grid")) throw new Error(); });
t("[SharedMedia] videos tab — file list",      () => { if (!smp.includes("videos")) throw new Error(); });
t("[SharedMedia] documents tab",               () => { if (!smp.includes("documents")) throw new Error(); });
t("[SharedMedia] links tab — preview row",     () => { if (!smp.includes("shared-media-link-row")) throw new Error(); });
t("[SharedMedia] audio tab",                   () => { if (!smp.includes("audio")) throw new Error(); });
t("[SharedMedia] GIFs tab",                    () => { if (!smp.includes("gifs")) throw new Error(); });
t("[SharedMedia] lazy image loading",          () => { if (!smp.includes('loading="lazy"')) throw new Error(); });
t("[SharedMedia] opens files in new tab",      () => { if (!smp.includes('target="_blank"')) throw new Error(); });
t("[SharedMedia] loading state shown",         () => { if (!smp.includes("loading")) throw new Error(); });
t("[SharedMedia] empty state message",         () => { if (!smp.includes("No") || !smp.includes("shared yet")) throw new Error(); });
t("[SharedMedia] cancelled fetch on cleanup",  () => { if (!smp.includes("cancelled")) throw new Error(); });
t("[SharedMedia] conversationApi.getSharedMedia called", () => { if (!smp.includes("getSharedMedia")) throw new Error(); });
t("[SharedMedia] tab refetches on change",     () => { if (!smp.includes("[open, conversationId, tab")) throw new Error(); });
t("[SharedMedia] formatFileSize for docs",     () => { if (!smp.includes("formatFileSize")) throw new Error(); });

// ── apiHelpers uploadApi ──────────────────────────────────────
const api = read("../client/src/utils/apiHelpers.js");
t("[apiHelpers] uploadApi.uploadFile exists",  () => { if (!api.includes("uploadApi") || !api.includes("uploadFile")) throw new Error(); });
t("[apiHelpers] uses FormData",                () => { if (!api.includes("FormData")) throw new Error(); });
t("[apiHelpers] appends file field",           () => { if (!api.includes("append") || !api.includes("file")) throw new Error(); });
t("[apiHelpers] isFormData: true",             () => { if (!api.includes("isFormData: true")) throw new Error(); });
t("[apiHelpers] returns data.file",            () => { if (!api.includes("data.file")) throw new Error(); });

console.log("\n--- TOTAL:", p, "passed,", f, "failed ---\n");
process.exit(f > 0 ? 1 : 0);
