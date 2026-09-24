/**
 * Does a font file actually contain a glyph for a code point?
 *
 * Answers from the file's own `cmap` table, not from the browser. Every other
 * way of asking is fooled by fallback: `document.fonts.check()` returns true
 * when *no* face covers the text, and comparing rendered widths in two fallback
 * stacks proves nothing when both stacks resolve to the same system Arabic font.
 * A glyph id of 0 in `cmap` is the font saying, in its own words, "not here".
 *
 * Handles WOFF2 (what next/font serves), WOFF 1 and bare TTF/OTF. WOFF2 is
 * Brotli, which Node's own zlib decodes — no dependency.
 */
import { brotliDecompressSync, inflateSync } from "node:zlib";

const WOFF2_TAGS = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca", "prep",
  "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE",
  "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt",
  "avar", "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty", "just", "lcar",
  "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill",
];

function base128(buf, at) {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const b = buf[at.i++];
    value = value * 128 + (b & 0x7f);
    if (!(b & 0x80)) return value;
  }
  throw new Error("bad UIntBase128");
}

/** Raw bytes of the `cmap` table, whatever the container. */
function cmapBytes(buf) {
  const sig = buf.toString("latin1", 0, 4);

  if (sig === "wOF2") {
    const numTables = buf.readUInt16BE(12);
    const compressedSize = buf.readUInt32BE(20);
    const at = { i: 48 };
    const tables = [];
    for (let t = 0; t < numTables; t++) {
      const flags = buf[at.i++];
      const idx = flags & 0x3f;
      const version = flags >> 6;
      let tag;
      if (idx === 63) {
        tag = buf.toString("latin1", at.i, at.i + 4);
        at.i += 4;
      } else tag = WOFF2_TAGS[idx];
      const origLength = base128(buf, at);
      const transformed = tag === "glyf" || tag === "loca" ? version === 0 : version !== 0;
      const length = transformed ? base128(buf, at) : origLength;
      tables.push({ tag, length });
    }
    const data = brotliDecompressSync(buf.subarray(at.i, at.i + compressedSize));
    let offset = 0;
    for (const t of tables) {
      if (t.tag === "cmap") return data.subarray(offset, offset + t.length);
      offset += t.length;
    }
    return null;
  }

  if (sig === "wOFF") {
    const numTables = buf.readUInt16BE(12);
    for (let t = 0; t < numTables; t++) {
      const e = 44 + t * 20;
      if (buf.toString("latin1", e, e + 4) !== "cmap") continue;
      const off = buf.readUInt32BE(e + 4);
      const comp = buf.readUInt32BE(e + 8);
      const orig = buf.readUInt32BE(e + 12);
      const raw = buf.subarray(off, off + comp);
      return comp < orig ? inflateSync(raw) : raw;
    }
    return null;
  }

  const numTables = buf.readUInt16BE(4);
  for (let t = 0; t < numTables; t++) {
    const e = 12 + t * 16;
    if (buf.toString("latin1", e, e + 4) !== "cmap") continue;
    const off = buf.readUInt32BE(e + 8);
    return buf.subarray(off, off + buf.readUInt32BE(e + 12));
  }
  return null;
}

/** Glyph id for `cp` from one cmap subtable (formats 4 and 12). 0 = missing. */
function lookup(sub, cp) {
  const format = sub.readUInt16BE(0);
  if (format === 12) {
    const groups = sub.readUInt32BE(12);
    for (let g = 0; g < groups; g++) {
      const o = 16 + g * 12;
      const start = sub.readUInt32BE(o);
      const end = sub.readUInt32BE(o + 4);
      if (cp >= start && cp <= end) return sub.readUInt32BE(o + 8) + (cp - start);
    }
    return 0;
  }
  if (format === 4) {
    if (cp > 0xffff) return 0;
    const segs = sub.readUInt16BE(6) / 2;
    const ends = 14;
    const starts = ends + segs * 2 + 2;
    const deltas = starts + segs * 2;
    const ranges = deltas + segs * 2;
    for (let s = 0; s < segs; s++) {
      const end = sub.readUInt16BE(ends + s * 2);
      if (end < cp) continue;
      const start = sub.readUInt16BE(starts + s * 2);
      if (start > cp) return 0;
      const delta = sub.readInt16BE(deltas + s * 2);
      const range = sub.readUInt16BE(ranges + s * 2);
      if (range === 0) return (cp + delta) & 0xffff;
      const at = ranges + s * 2 + range + (cp - start) * 2;
      const glyph = sub.readUInt16BE(at);
      return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
    }
    return 0;
  }
  return 0;
}

/** Returns a function cp → boolean for the given font file bytes. */
export function glyphChecker(fontBytes) {
  const cmap = cmapBytes(fontBytes);
  if (!cmap) throw new Error("no cmap table");
  const n = cmap.readUInt16BE(2);
  const subs = [];
  for (let r = 0; r < n; r++) {
    const platform = cmap.readUInt16BE(4 + r * 8);
    const encoding = cmap.readUInt16BE(6 + r * 8);
    const offset = cmap.readUInt32BE(8 + r * 8);
    const sub = cmap.subarray(offset);
    const format = sub.readUInt16BE(0);
    if ((format === 4 || format === 12) && (platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10)))) {
      subs.push(sub);
    }
  }
  return (cp) => subs.some((sub) => lookup(sub, cp) !== 0);
}
