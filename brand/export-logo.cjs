// Export the existing code-native wordmark and approved artwork without regeneration.
// Usage: node brand/export-logo.cjs <bundled-node-modules-directory>
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");

async function main() {
  const modules = process.argv[2];
  if (!modules) throw new Error("Provide the bundled Node modules directory.");
  const { createCanvas, ImageData, GlobalFonts } = require(
    path.join(modules, "@napi-rs/canvas"),
  );
  const sharp = require(path.join(modules, "sharp"));
  const frontend = path.resolve(__dirname, "../frontend");
  const cssDir = path.join(frontend, ".next-vercel/static/css");
  const styles = (
    await Promise.all(
      (await fs.readdir(cssDir))
        .filter((file) => file.endsWith(".css"))
        .map((file) => fs.readFile(path.join(cssDir, file), "utf8")),
    )
  ).join("\n");
  const fontFace = [...styles.matchAll(/@font-face\{[^}]+\}/g)]
    .map((match) => match[0])
    .find(
      (rule) =>
        /font-family:Great Vibes;/.test(rule) &&
        /unicode-range:u\+00/.test(rule),
    );
  assert.ok(
    fontFace,
    "The existing Great Vibes Latin font must be built first.",
  );
  const fontFile = fontFace.match(
    /src:url\(\/_next\/static\/media\/([^()]+)\)/,
  )[1];
  const fontPath = path.join(frontend, ".next-vercel/static/media", fontFile);
  const family = "Commitment Pools Export Script";
  const registration = GlobalFonts.registerFromPath(fontPath, family);
  assert.ok(
    registration && GlobalFonts.has(family),
    "Exact logo font could not be loaded; refusing fallback lettering.",
  );
  const artworkPath = path.join(frontend, "public/brand/emperor-vortex.png");
  const original = await fs.readFile(artworkPath);
  const decodedArtwork = await sharp(original)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const artwork = createCanvas(
    decodedArtwork.info.width,
    decodedArtwork.info.height,
  );
  artwork
    .getContext("2d")
    .putImageData(
      new ImageData(
        new Uint8ClampedArray(decodedArtwork.data),
        decodedArtwork.info.width,
        decodedArtwork.info.height,
      ),
      0,
      0,
    );
  const outputDir = path.join(__dirname, "submission");
  await fs.mkdir(outputDir, { recursive: true });
  const title = "Commitment Pools";
  const size = 1024;
  const records = [];

  for (const background of ["black", "transparent"]) {
    const canvas = createCanvas(size, size);
    const context = canvas.getContext("2d");
    if (background === "black") {
      context.fillStyle = "#08090b";
      context.fillRect(0, 0, size, size);
    }
    context.fillStyle = "#f2d58a";
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    let fontSize = 145;
    context.font = `${fontSize}px "${family}"`;
    let metrics = context.measureText(title);
    const fit = Math.min(
      1,
      864 / (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight),
      145 /
        (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent),
    );
    fontSize *= fit;
    context.font = `${fontSize}px "${family}"`;
    metrics = context.measureText(title);
    const visibleWidth =
      metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    const textX = (size - visibleWidth) / 2 + metrics.actualBoundingBoxLeft;
    const textY = 52 + metrics.actualBoundingBoxAscent;
    context.fillText(title, textX, textY);
    context.drawImage(artwork, 113, 210, 798, 798);

    const data = await canvas.encode("png");
    const name = `commitment-pools-logo-${background}-1024.png`;
    const destination = path.join(outputDir, name);
    // Exports never silently overwrite a previous submission artifact.
    await fs.writeFile(destination, data, { flag: "wx" });
    const decoded = await sharp(data).metadata();
    assert.equal(decoded.width, size);
    assert.equal(decoded.height, size);
    const corner = context.getImageData(0, 0, 1, 1).data;
    assert.equal(corner[3], background === "transparent" ? 0 : 255);
    records.push({
      file: name,
      width: size,
      height: size,
      background,
      bytes: data.length,
      sha256: createHash("sha256").update(data).digest("hex"),
    });
  }

  const manifest = {
    product: title,
    font: "Great Vibes",
    artworkSha256: createHash("sha256").update(original).digest("hex"),
    mode: "Deterministic export of existing logo components; no image generation or artwork repainting.",
    files: records,
  };
  await fs.writeFile(
    path.join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    { flag: "wx" },
  );
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error.stack);
  process.exitCode = 1;
});
