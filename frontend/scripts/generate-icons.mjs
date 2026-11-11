/**
 * Generates the favicon and PWA icons from the official organisation logo
 * (public/cropped-logo-removebg-preview.webp).
 *
 * The logo is decoded once in headless Chrome and drawn onto square canvases at
 * the exact icon sizes, so the artwork is never redrawn, cropped or stretched:
 * every icon keeps the source proportions, with only the canvas around it
 * changing (transparent, or the brand canvas behind opaque icons).
 *
 * Run: node scripts/generate-icons.mjs
 */
import { spawn } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const iconsDir = path.join(publicDir, "icons");
const LOGO = path.join(publicDir, "cropped-logo-removebg-preview.webp");

/** Opaque icons (iOS / maskable) sit on the manifest's canvas colour. */
const BRAND_CANVAS = "#FAFAF8";

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error("Chrome not found. Set CHROME_PATH to the Chrome executable.");
  }
  return found;
}

/** Runs inside the page: decode the logo, then draw one square canvas per job. */
function renderInPage(base64, jobs) {
  const image = new Image();
  image.src = "data:image/webp;base64," + base64;
  return image.decode().then(() =>
    jobs.map((job) => {
      const canvas = document.createElement("canvas");
      canvas.width = job.size;
      canvas.height = job.size;
      const context = canvas.getContext("2d");
      if (job.background) {
        context.fillStyle = job.background;
        context.fillRect(0, 0, job.size, job.size);
      }
      // Contain, never cover: the logo keeps its aspect ratio.
      const width = (job.size * (job.scale ?? 100)) / 100;
      const height = width * (image.naturalHeight / image.naturalWidth);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        image,
        (job.size - width) / 2,
        (job.size - height) / 2,
        width,
        height,
      );
      return canvas.toDataURL("image/png").split(",")[1];
    }),
  );
}

const jobs = [
  { key: "favicon-16", size: 16 },
  { key: "favicon-32", size: 32 },
  { key: "favicon-48", size: 48 },
  { key: "icon-192", size: 192 },
  { key: "icon-512", size: 512 },
  { key: "apple-touch-icon", size: 180, scale: 84, background: BRAND_CANVAS },
  { key: "icon-maskable-512", size: 512, scale: 60, background: BRAND_CANVAS },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function renderAll() {
  const work = mkdtempSync(path.join(tmpdir(), "mm-icons-"));
  const port = 9400 + Math.floor(Math.random() * 400);
  const chrome = spawn(
    findChrome(),
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      `--user-data-dir=${path.join(work, "profile")}`,
      `--remote-debugging-port=${port}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let socket;
  try {
    let pageUrl;
    for (let attempt = 0; attempt < 80 && !pageUrl; attempt++) {
      try {
        const targets = await (
          await fetch(`http://127.0.0.1:${port}/json/list`)
        ).json();
        pageUrl = targets.find(
          (target) => target.type === "page" && target.webSocketDebuggerUrl,
        )?.webSocketDebuggerUrl;
      } catch {
        /* Chrome is still starting. */
      }
      if (!pageUrl) await sleep(250);
    }
    if (!pageUrl) throw new Error("Chrome did not expose a DevTools target.");

    socket = new WebSocket(pageUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener(
        "error",
        () => reject(new Error("Could not connect to Chrome DevTools.")),
        { once: true },
      );
    });

    const base64 = readFileSync(LOGO).toString("base64");
    const expression = `(${renderInPage.toString()})(${JSON.stringify(
      base64,
    )}, ${JSON.stringify(jobs)})`;

    const reply = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Chrome did not finish rendering the icons.")),
        60_000,
      );
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.id !== 1) return;
        clearTimeout(timer);
        resolve(message);
      });
      socket.send(
        JSON.stringify({
          id: 1,
          method: "Runtime.evaluate",
          params: { expression, awaitPromise: true, returnByValue: true },
        }),
      );
    });

    if (reply.error) throw new Error(reply.error.message);
    if (reply.result.exceptionDetails) {
      throw new Error(reply.result.exceptionDetails.text ?? "Rendering failed.");
    }

    return Object.fromEntries(
      jobs.map((job, index) => [
        job.key,
        Buffer.from(reply.result.result.value[index], "base64"),
      ]),
    );
  } finally {
    socket?.close();
    chrome.kill();
    await new Promise((resolve) => {
      if (chrome.exitCode !== null) return resolve();
      chrome.once("exit", resolve);
      setTimeout(resolve, 3_000);
    });
    try {
      rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
    } catch {
      /* Windows may still hold the temporary Chrome profile; it sits in the OS
         temp directory, so leaving it behind is harmless. */
    }
  }
}

/** Multi-resolution .ico wrapping PNG renders for legacy browsers. */
function writeIco(out, pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + 16 * pngs.length;
  const entries = [];
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  writeFileSync(out, Buffer.concat([header, ...entries, ...pngs.map((png) => png.data)]));
}

const rendered = await renderAll();

mkdirSync(iconsDir, { recursive: true });

// Browser tab: the exact logo, transparent, crisp at tab sizes.
writeFileSync(path.join(iconsDir, "favicon-32.png"), rendered["favicon-32"]);

// One legacy/shortcut icon carrying 16, 32 and 48.
writeIco(path.join(publicDir, "favicon.ico"), [
  { size: 16, data: rendered["favicon-16"] },
  { size: 32, data: rendered["favicon-32"] },
  { size: 48, data: rendered["favicon-48"] },
]);

// PWA "any" icons: logo fills the square, transparent edges preserved.
writeFileSync(path.join(iconsDir, "icon-192.png"), rendered["icon-192"]);
writeFileSync(path.join(iconsDir, "icon-512.png"), rendered["icon-512"]);

// iOS applies its own rounded mask, so the logo sits on an opaque canvas.
writeFileSync(
  path.join(iconsDir, "apple-touch-icon.png"),
  rendered["apple-touch-icon"],
);

// Maskable: logo inside the 80% safe zone on an opaque full-bleed canvas.
writeFileSync(
  path.join(iconsDir, "icon-maskable-512.png"),
  rendered["icon-maskable-512"],
);

// Plain logo exports kept alongside the icon set.
copyFileSync(path.join(iconsDir, "icon-192.png"), path.join(iconsDir, "logo-192.png"));
copyFileSync(path.join(iconsDir, "icon-512.png"), path.join(iconsDir, "logo-512.png"));

console.log(`Wrote favicon.ico and the icon set to ${iconsDir}`);
