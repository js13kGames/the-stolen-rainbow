// Reproducible, single-file offline build. No runtime dependencies.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { minify } = require('terser');
process.chdir(__dirname);
function crc32(bytes) {
  let crc = -1;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}
function zip(name, raw) {
  const data = zlib.deflateRawSync(raw, { level: 9 });
  const filename = Buffer.from(name), checksum = crc32(raw);
  const local = Buffer.alloc(30), central = Buffer.alloc(46), end = Buffer.alloc(22);
  local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
  local.writeUInt16LE(33, 12); local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(data.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(filename.length, 26);
  central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
  central.writeUInt16LE(8, 10); central.writeUInt16LE(33, 14); central.writeUInt32LE(checksum, 16);
  central.writeUInt32LE(data.length, 20); central.writeUInt32LE(raw.length, 24); central.writeUInt16LE(filename.length, 28);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + filename.length, 12);
  end.writeUInt32LE(local.length + filename.length + data.length, 16);
  return Buffer.concat([local, filename, data, central, filename, end]);
}
// Validate first; stage every output, and restore the previous set on write errors.
function publish(outputs) {
  const files = outputs.map(([name, data]) => ({name, data, temp: name + '.tmp', previous: fs.existsSync(name) ? fs.readFileSync(name) : null}));
  let replacing = false;
  try {
    for (const file of files) fs.writeFileSync(file.temp, file.data);
    replacing = true;
    for (const file of files) fs.renameSync(file.temp, file.name);
  } catch (error) {
    if (replacing) for (const file of files) {
      if (file.previous !== null) fs.writeFileSync(file.name, file.previous);
      else if (fs.existsSync(file.name)) fs.unlinkSync(file.name);
    }
    throw error;
  } finally {
    for (const file of files) if (fs.existsSync(file.temp)) fs.unlinkSync(file.temp);
  }
}

(async () => {
  // Omit review-only phase captions from the competition archive.
  const source = fs.readFileSync('game.js', 'utf8').replace('const REVIEW = true;', 'const REVIEW = false;');
  const result = await minify(source, {
    ecma: 2020, toplevel: true,
    compress: { passes: 3, unsafe: false },
    mangle: { properties: { regex: /^(cool|face|move|hp|inv|life|delay|vx|vy|bombs|nodes|frozen|orbit|release|phase|radius|spin|curve|bounce|seed|blast|action|emitter|forming|links|owner|notice|summons|pulses|reload|power|pierce|hitBoss|exploded|startScore|exposed)$/ } }, format: { comments: false, ascii_only: false }
  });
  const { Packer } = await import('roadroller');
  const options = fs.existsSync('compression.json') ? JSON.parse(fs.readFileSync('compression.json','utf8')) : null;
  const packer = new Packer([{ data: result.code, type: 'js', action: 'eval' }], options || { maxMemoryMB: 150 });
  let chosen = options;
  if (!options || process.argv.includes('--optimize')) {
    const oldRandom = Math.random; let seed = 1729;
    Math.random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
    try { chosen = { maxMemoryMB: 150, ...(await packer.optimize(2)).best }; }
    finally { Math.random = oldRandom; }
  }
  const decoder = packer.makeDecoder();
  const packed = decoder.firstLine + decoder.secondLine;
  const html = fs.readFileSync('index.html', 'utf8').trim()
    .replace(/\n\s*/g, '')
    .replace('<script src="game.js"></script>', () => '<script>' + packed.replace(/<\/script/gi, '<\\/script') + '</script>');
  const bytes = Buffer.from(html), archive = zip('index.html', bytes);
  const limit = 13 * 1024;
  if (archive.length > limit) throw Error(`ZIP exceeds 13 KiB: ${archive.length} / ${limit}`);
  fs.mkdirSync('dist', { recursive: true });
  publish([['dist/index.html', bytes], ['dist/stolen-rainbow-13k.zip', archive], ['compression.json', JSON.stringify(chosen, null, 2) + '\n']]);
  console.log(JSON.stringify({ html: bytes.length, zip: archive.length, limit, remaining: limit - archive.length }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
