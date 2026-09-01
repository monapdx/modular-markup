/* MBOX Viewer — streaming index + lazy message load */

// --- Utilities ----------------------------------------------------------------

const yieldToMain = () => new Promise((r) => requestAnimationFrame(r));

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleString();
};

const esc = (s) =>
  (s || "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));

const formatSize = (n) => {
  if (n == null || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

const parseAddrs = (v) =>
  (v || "")
    .split(/,\s*(?![^<]*>)/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");

const qpDecode = (str) =>
  str
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

const b64DecodeUtf8 = (b64) => {
  const clean = b64.replace(/\s+/g, "");
  try {
    return decodeURIComponent(escape(atob(clean)));
  } catch {
    try {
      return atob(clean);
    } catch {
      return b64;
    }
  }
};

const b64ToUint8Array = (b64) => {
  const clean = b64.replace(/\s+/g, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const decodeMimeWords = (str) => {
  if (!str) return "";
  return str.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, _cs, enc, txt) => {
    try {
      if (enc.toUpperCase() === "B") {
        return b64DecodeUtf8(txt);
      }
      return qpDecode(txt.replace(/_/g, " "));
    } catch {
      return txt;
    }
  });
};

const MAX_TEXT_DECODE = 512 * 1024; // skip decoding larger text parts unless attachment download

function looksBase64Text(s) {
  const t = s.replace(/\s+/g, "");
  if (t.length < 40 || t.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+=*$/.test(t.slice(0, Math.min(400, t.length)));
}

function looksQuotedPrintable(s) {
  return /=([0-9A-Fa-f]{2})/.test(s) && (/=3D/i.test(s) || /=20|=0A|=0D|=C3|=E2/i.test(s));
}

function smartDecodePart(data, enc, ct) {
  const encoding = (enc || "").toLowerCase().trim();
  let decoded = data;

  if (encoding.includes("base64")) {
    decoded = b64DecodeUtf8(data);
  } else if (encoding.includes("quoted-printable") || encoding === "qp") {
    decoded = qpDecode(data);
  } else if (looksBase64Text(data.trim()) && /^(text\/|message\/)/i.test(ct || "text/plain")) {
    decoded = b64DecodeUtf8(data);
  } else if (looksQuotedPrintable(data)) {
    decoded = qpDecode(data);
  }

  // Second pass: some Gmail parts decode to still-qp inner content
  if (looksQuotedPrintable(decoded) && !/<[a-z][\s>]/i.test(decoded)) {
    decoded = qpDecode(decoded);
  }

  return decoded;
}

// --- Header parsing -----------------------------------------------------------

function parseHeaders(raw) {
  const lines = raw.split(/\r?\n/);
  const out = [];
  let cur = "";
  for (const ln of lines) {
    if (/^\s/.test(ln)) cur += " " + ln.trim();
    else {
      if (cur) out.push(cur);
      cur = ln.trim();
    }
  }
  if (cur) out.push(cur);

  const headers = {};
  for (const l of out) {
    const i = l.indexOf(":");
    if (i < 0) continue;
    const k = l.slice(0, i).toLowerCase();
    const v = l.slice(i + 1).trim();
    (headers[k] ||= []).push(v);
  }
  const get = (k) => headers[k.toLowerCase()]?.[0] || "";
  return { headers, get };
}

function parseGmailLabels(raw) {
  return (raw || "")
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((s) => s.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

// --- Cheap attachment / snippet detection during indexing ---------------------

function scanBodyHints(bodySlice) {
  const hints = { hasAttachments: false, filenames: [], preview: "" };

  if (/content-disposition\s*:\s*attachment/i.test(bodySlice)) hints.hasAttachments = true;
  if (/multipart\/(mixed|related|signed)/i.test(bodySlice)) hints.hasAttachments = true;

  const fnRe = /filename\*?=(?:UTF-8''|"?)([^";\r\n]+)/gi;
  let m;
  while ((m = fnRe.exec(bodySlice)) !== null) {
    hints.hasAttachments = true;
    try {
      hints.filenames.push(decodeURIComponent(m[1].replace(/^"|"$/g, "")));
    } catch {
      hints.filenames.push(m[1].replace(/^"|"$/g, ""));
    }
  }

  // Tiny plain-text preview from first text/plain part if small enough
  const plainMatch = bodySlice.match(
    /content-type:\s*text\/plain[^\r\n]*[\r\n]+(?:[^\r\n]+[\r\n]+)*?\r?\n\r?\n([\s\S]{0,400})/i
  );
  if (plainMatch) {
    let p = plainMatch[1].replace(/\r?\n/g, " ").trim();
    if (p.length > 160) p = p.slice(0, 157) + "…";
    hints.preview = p;
  }

  hints.filenames = [...new Set(hints.filenames)].slice(0, 8);
  return hints;
}

function buildIndexEntry(byteStart, byteEnd, headerText, bodyPeek) {
  const { get } = parseHeaders(headerText);
  const hints = scanBodyHints(bodyPeek);

  const ctype = (get("content-type") || "").toLowerCase();
  if (/multipart\//.test(ctype) && !hints.hasAttachments) {
    hints.hasAttachments = /multipart\/(mixed|related)/.test(ctype);
  }

  return {
    subject: decodeMimeWords(get("subject")) || "(no subject)",
    from: decodeMimeWords(get("from")),
    to: decodeMimeWords(get("to")),
    date: get("date"),
    messageId: get("message-id"),
    labels: parseGmailLabels(get("x-gmail-labels")),
    byteStart,
    byteEnd,
    approximateSize: byteEnd - byteStart,
    hasAttachments: hints.hasAttachments,
    attachmentFilenames: hints.filenames,
    preview: hints.preview,
  };
}

// --- Streaming MBOX indexer ---------------------------------------------------

const FROM_PREFIX = [0x46, 0x72, 0x6f, 0x6d, 0x20]; // "From "

function isFromBoundary(bytes, pos) {
  if (pos + 5 > bytes.length) return false;
  if (pos > 0 && bytes[pos - 1] === 0x3e) return false; // quoted ">From "
  for (let i = 0; i < 5; i++) {
    if (bytes[pos + i] !== FROM_PREFIX[i]) return false;
  }
  return true;
}

function findNextNewline(bytes, start) {
  for (let i = start; i < bytes.length; i++) {
    if (bytes[i] === 0x0a) return i;
  }
  return -1;
}

function concatUint8(a, b) {
  if (!a.length) return b;
  if (!b.length) return a;
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function indexOfDoubleNewline(bytes, start, end) {
  for (let i = start; i < end - 1; i++) {
    if (bytes[i] === 0x0a && bytes[i + 1] === 0x0a) return i;
    if (bytes[i] === 0x0d && bytes[i + 1] === 0x0a && i + 3 < end && bytes[i + 2] === 0x0d && bytes[i + 3] === 0x0a) {
      return i;
    }
  }
  return -1;
}

const HEADER_SCAN_MAX = 64 * 1024;
const BODY_PEEK_MAX = 12 * 1024;

function bodyStartAfterHeaders(bytes) {
  const dbl = indexOfDoubleNewline(bytes, 0, bytes.length);
  if (dbl < 0) return -1;
  if (
    dbl + 3 < bytes.length &&
    bytes[dbl] === 0x0d &&
    bytes[dbl + 1] === 0x0a &&
    bytes[dbl + 2] === 0x0d &&
    bytes[dbl + 3] === 0x0a
  ) {
    return dbl + 4;
  }
  return dbl + 2;
}

async function indexMbox(file, onProgress) {
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const messages = [];
  const CARRY_TAIL = 96;
  const YIELD_EVERY = 256 * 1024;

  let bytesRead = 0;
  let bytesSinceYield = 0;
  let carry = new Uint8Array(0);
  let sawFirstFrom = false;

  let msgStart = null;
  let headerBuf = new Uint8Array(0);
  let headerDone = false;
  let bodyPeek = new Uint8Array(0);

  const resetMsg = (start) => {
    msgStart = start;
    headerBuf = new Uint8Array(0);
    headerDone = false;
    bodyPeek = new Uint8Array(0);
  };

  const feedMsg = (chunk) => {
    if (msgStart == null || !chunk.length) return;

    if (!headerDone) {
      const combined = concatUint8(headerBuf, chunk);
      const bodyStart = bodyStartAfterHeaders(combined);

      if (bodyStart >= 0) {
        const dbl = indexOfDoubleNewline(combined, 0, combined.length);
        headerBuf = combined.slice(0, dbl);
        headerDone = true;
        chunk = combined.slice(bodyStart);
        if (!chunk.length) return;
      } else if (combined.length > HEADER_SCAN_MAX) {
        headerBuf = combined.slice(0, HEADER_SCAN_MAX);
        headerDone = true;
        chunk = combined.slice(HEADER_SCAN_MAX);
      } else {
        headerBuf = combined;
        return;
      }
    }

    if (bodyPeek.length < BODY_PEEK_MAX && chunk.length) {
      const room = BODY_PEEK_MAX - bodyPeek.length;
      bodyPeek = concatUint8(bodyPeek, chunk.slice(0, room));
    }
  };

  const finalizeMessage = (byteEnd) => {
    if (msgStart == null || byteEnd <= msgStart) return;

    const headerText = decoder.decode(headerBuf);
    const peekText = decoder.decode(bodyPeek.slice(0, BODY_PEEK_MAX));
    messages.push(buildIndexEntry(msgStart, byteEnd, headerText, peekText));
    resetMsg(null);
  };

  const lineEndAfter = (bytes, fromLineStart) => {
    const nl = findNextNewline(bytes, fromLineStart);
    if (nl < 0) return -1;
    if (nl > 0 && bytes[nl - 1] === 0x0d) return nl + 1;
    if (bytes[nl] === 0x0d && nl + 1 < bytes.length && bytes[nl + 1] === 0x0a) return nl + 2;
    return nl + 1;
  };

  const scanCarry = () => {
    let i = 0;
    while (i < carry.length) {
      const atLineStart = i === 0 || carry[i - 1] === 0x0a;
      if (atLineStart && isFromBoundary(carry, i)) {
        const boundaryAbs = bytesRead - carry.length + i;

        if (sawFirstFrom && msgStart != null) {
          feedMsg(carry.slice(0, i));
          finalizeMessage(boundaryAbs);
        }
        sawFirstFrom = true;

        const lineEnd = lineEndAfter(carry, i);
        if (lineEnd < 0) {
          carry = carry.slice(i);
          return;
        }

        resetMsg(bytesRead - carry.length + lineEnd);
        carry = carry.slice(lineEnd);
        i = 0;
        continue;
      }
      i++;
    }

    if (carry.length > CARRY_TAIL) {
      const feedLen = carry.length - CARRY_TAIL;
      if (msgStart != null) feedMsg(carry.slice(0, feedLen));
      carry = carry.slice(feedLen);
    }
  };

  if (file.size === 0) return messages;

  const reader = file.stream().getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    bytesRead += value.length;
    bytesSinceYield += value.length;
    carry = concatUint8(carry, value);
    scanCarry();

    if (onProgress) {
      onProgress({
        bytesRead,
        totalBytes: file.size,
        messageCount: messages.length,
      });
    }

    if (bytesSinceYield >= YIELD_EVERY) {
      bytesSinceYield = 0;
      await yieldToMain();
    }
  }

  if (msgStart != null) {
    feedMsg(carry);
    finalizeMessage(file.size);
  }

  return messages;
}

// --- Lazy message read + parse ------------------------------------------------

async function readMessage(file, byteStart, byteEnd) {
  const blob = file.slice(byteStart, byteEnd);
  return blob.text();
}

function decodeBody(ct, enc, data) {
  const encoding = (enc || "").toLowerCase();
  const size = data.length;

  if (encoding.includes("base64") && size > MAX_TEXT_DECODE) {
    return { ct, data: "[Large base64 content omitted — download attachment instead]", skipped: true };
  }

  const decoded = smartDecodePart(data, enc, ct);

  if (!ct.includes("text/") && size > MAX_TEXT_DECODE) {
    return { ct, data: "[Binary content omitted]", skipped: true };
  }

  return { ct, data: decoded, skipped: false };
}

function applyTransferEncoding(data, encoding) {
  const enc = (encoding || "").toLowerCase();
  if (enc.includes("base64")) return b64DecodeUtf8(data);
  if (enc.includes("quoted-printable")) return qpDecode(data);
  return data;
}

function extractBoundary(ctype, body) {
  const quoted = /;\s*boundary\s*=\s*"([^"]+)"/i.exec(ctype);
  if (quoted) return quoted[1].trim();

  const bare = /;\s*boundary\s*=\s*([^;\s]+)/i.exec(ctype);
  if (bare) return bare[1].replace(/^["']|["']$/g, "").trim();

  const fromBody = /(?:^|\r?\n)--([^\r\n]+)/.exec(body);
  if (fromBody) return fromBody[1].replace(/-+$/g, "").trim();

  return null;
}

function splitHeadersBody(raw) {
  const match = raw.match(/\r\n\r\n|\n\r\n|\r\n\n|\n\n/);
  if (!match || match.index == null) return { headerText: raw.trim(), body: "" };
  return {
    headerText: raw.slice(0, match.index),
    body: raw.slice(match.index + match[0].length),
  };
}

function stripScripts(html) {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

function buildCidMap(parts) {
  const map = new Map();
  for (const p of parts) {
    const cidRaw = p.headers?.get?.("content-id") || "";
    const cid = cidRaw.replace(/^<|>$/g, "").trim();
    if (!cid) continue;
    if (!/^image\//i.test(p.ct) && !/^application\/octet-stream/i.test(p.ct)) continue;
    if (p.data.length > MAX_TEXT_DECODE) continue;

    try {
      const enc = (p.enc || "").toLowerCase();
      let bytes;
      if (enc.includes("base64") || looksBase64Text(p.data.replace(/\s+/g, ""))) {
        bytes = b64ToUint8Array(p.data);
      } else {
        const decoded = smartDecodePart(p.data, p.enc, p.ct);
        bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i) & 0xff;
      }
      const mime = p.ct.split(";")[0].trim() || "image/png";
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      map.set(cid, `data:${mime};base64,${btoa(bin)}`);
      map.set(cid.toLowerCase(), `data:${mime};base64,${btoa(bin)}`);
    } catch {
      /* skip broken inline images */
    }
  }
  return map;
}

function replaceCidRefs(html, cidMap) {
  if (!cidMap.size) return html;
  return html.replace(/cid:([^"'\s>]+)/gi, (match, cid) => {
    const key = cid.replace(/^<|>$/g, "");
    return cidMap.get(key) || cidMap.get(key.toLowerCase()) || match;
  });
}

function prepareHtmlDocument(html) {
  let doc = stripScripts(html.trim());
  if (!doc) return "";

  if (/<!doctype|<html[\s>]/i.test(doc)) {
    return doc;
  }

  return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>
    body { font-family: sans-serif; padding: 12px; color: #111; background: #fff; line-height: 1.5; }
    img { max-width: 100%; height: auto; }
    a { color: #0366d6; }
  </style></head><body>${doc}</body></html>`;
}

function renderHtmlInFrame(frame, html) {
  const doc = prepareHtmlDocument(html);
  if (!doc) return false;
  frame.removeAttribute("src");
  frame.srcdoc = doc;
  return true;
}

function htmlLooksEmpty(html) {
  if (/<(?:img|table|svg|video|iframe|div|p|br)\b/i.test(html)) return false;
  const stripped = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return stripped.length < 4;
}

function isDisplayableTextPart(part) {
  if (!/^text\/(plain|html)\b/i.test(part.ct)) return false;
  return !/attachment/i.test(part.disp);
}

function parseMultipart(boundary, data) {
  const cleanBoundary = boundary.replace(/^["']|["']$/g, "").trim();
  const bd = "--" + cleanBoundary;
  const segments = data.split(bd).slice(1);
  const out = [];

  for (let segment of segments) {
    segment = segment.replace(/^\r?\n/, "");
    const trimmed = segment.trim();
    if (!trimmed || trimmed === "--" || trimmed.startsWith("--")) break;

    const { headerText, body: partBody } = splitHeadersBody(segment);
    if (!headerText.trim()) continue;

    const pHeaders = parseHeaders(headerText);
    const ct = (pHeaders.get("content-type") || "text/plain").toLowerCase();
    const enc = (pHeaders.get("content-transfer-encoding") || "").toLowerCase();
    const disp = (pHeaders.get("content-disposition") || "").toLowerCase();
    const nameMatch =
      /name="?([^";]+)"?/i.exec(ct) || /filename="?([^";]+)"?/i.exec(disp);
    const filename = nameMatch ? decodeMimeWords(nameMatch[1]) : null;

    let pdata = partBody.replace(/\r?\n--[^\r\n]+(--)?\s*$/, "").trimEnd();

    if (/^multipart\//i.test(ct)) {
      const nestedBoundary = extractBoundary(ct, pdata);
      if (nestedBoundary) {
        out.push(...parseMultipart(nestedBoundary, pdata));
        continue;
      }
    }

    if (/^message\/(rfc822|global|delivery-status)/i.test(ct)) {
      const nested = parseMessage(partBody || pdata);
      if (nested.content?.value && !nested.content.value.startsWith("[No readable")) {
        out.push({
          headers: pHeaders,
          ct: nested.content.kind === "html" ? "text/html" : "text/plain",
          enc: "",
          disp: "",
          filename: null,
          data: nested.content.value,
        });
      }
      continue;
    }

    out.push({ headers: pHeaders, ct, enc, disp, filename, data: pdata });
  }
  return out;
}

function pickDisplayParts(parts) {
  const htmlCandidates = parts.filter(
    (p) => /^text\/html\b/i.test(p.ct) && isDisplayableTextPart(p)
  );
  const textCandidates = parts.filter(
    (p) => /^text\/plain\b/i.test(p.ct) && isDisplayableTextPart(p)
  );
  return {
    htmlPart: htmlCandidates[0] || null,
    textPart: textCandidates[0] || null,
  };
}

function extractTextFallback(rawBody) {
  const re =
    /Content-Type:\s*(text\/html|text\/plain)([^\r\n]*(?:[\r\n]+[ \t][^\r\n]*)*)[\r\n]+((?:Content-[^\r\n]*[\r\n]+)*)[\r\n]+([\s\S]*?)(?=[\r\n]--[^\r\n]+[\r\n]|$)/gi;
  const blocks = [];
  let m;
  while ((m = re.exec(rawBody)) !== null) {
    blocks.push({ type: m[1].toLowerCase(), headerBlock: m[3], body: m[4] });
  }

  const html = blocks.find((b) => b.type === "text/html");
  if (html) {
    const enc = /Content-Transfer-Encoding:\s*([^\r\n]+)/i.exec(html.headerBlock)?.[1] || "";
    const d = decodeBody("text/html", enc, html.body.trim());
    return { kind: "html", value: d.data, plainFallback: "", skipped: d.skipped };
  }

  const plain = blocks.find((b) => b.type === "text/plain");
  if (plain) {
    const enc = /Content-Transfer-Encoding:\s*([^\r\n]+)/i.exec(plain.headerBlock)?.[1] || "";
    const d = decodeBody("text/plain", enc, plain.body.trim());
    return { kind: "text", value: d.data, plainFallback: "", skipped: d.skipped };
  }

  return null;
}

function parseMessage(raw) {
  const { headerText: rawHeaders, body: rawBody } = splitHeadersBody(raw);
  const { get } = parseHeaders(rawHeaders);

  const meta = {
    subject: decodeMimeWords(get("subject")) || "(no subject)",
    from: decodeMimeWords(get("from")),
    to: decodeMimeWords(get("to")),
    date: get("date"),
    messageId: get("message-id"),
    labels: parseGmailLabels(get("x-gmail-labels")),
  };

  let content = { kind: "text", value: rawBody };
  let attachments = [];

  const ctype = (get("content-type") || "text/plain").toLowerCase();
  const cte = (get("content-transfer-encoding") || "").toLowerCase();
  let body = applyTransferEncoding(rawBody, cte);

  if (/^multipart\//i.test(ctype)) {
    const boundary = extractBoundary(ctype, body);
    let parts = boundary ? parseMultipart(boundary, body) : [];

    if (!parts.length && boundary && cte.includes("base64")) {
      body = applyTransferEncoding(rawBody, "");
      parts = parseMultipart(boundary, body);
    }

    const { htmlPart, textPart } = pickDisplayParts(parts);
    const cidMap = buildCidMap(parts);

    if (htmlPart) {
      const d = decodeBody(htmlPart.ct, htmlPart.enc, htmlPart.data);
      let html = replaceCidRefs(d.data, cidMap);
      const plainFallback = textPart ? decodeBody(textPart.ct, textPart.enc, textPart.data).data : "";
      content = { kind: "html", value: html, plainFallback, skipped: d.skipped };
    } else if (textPart) {
      const d = decodeBody(textPart.ct, textPart.enc, textPart.data);
      content = { kind: "text", value: d.data, plainFallback: "", skipped: d.skipped };
    } else {
      const fallback = extractTextFallback(body);
      content = fallback
        ? { ...fallback, plainFallback: "" }
        : {
            kind: "text",
            value: "[No readable text/html or text/plain part found]",
            plainFallback: "",
            skipped: false,
          };
    }

    attachments = parts
      .filter((p) => /attachment/i.test(p.disp) || (p.filename && !/^text\//i.test(p.ct)))
      .map((p) => ({
        filename: p.filename || "attachment",
        mime: p.ct.split(";")[0].trim() || "application/octet-stream",
        encoding: p.enc,
        rawEncoded: p.data,
        sizeEstimate: p.data.length,
      }));
  } else {
    const d = decodeBody(ctype, cte, rawBody);
    content = {
      kind: /text\/html/i.test(ctype) ? "html" : "text",
      value: d.data,
      plainFallback: "",
      skipped: d.skipped,
    };

    const disp = (get("content-disposition") || "").toLowerCase();
    const fnMatch = /filename="?([^";]+)"?/i.exec(disp) || /name="?([^";]+)"?/i.exec(ctype);
    if (/attachment/i.test(disp) || fnMatch) {
      attachments.push({
        filename: fnMatch ? decodeMimeWords(fnMatch[1]) : "attachment",
        mime: ctype.split(";")[0].trim(),
        encoding: cte,
        rawEncoded: rawBody,
        sizeEstimate: rawBody.length,
      });
    }
  }

  return { ...meta, content, attachments };
}

// --- LRU message cache --------------------------------------------------------

class LRUCache {
  constructor(limit = 20) {
    this.limit = limit;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return undefined;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  set(key, val) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, val);
    while (this.map.size > this.limit) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
  }

  clear() {
    this.map.clear();
  }
}

// --- App state ----------------------------------------------------------------

const state = {
  file: null,
  messages: [],
  filtered: [],
  activeId: null,
  mailbox: "All Mail",
  labels: new Map(),
  query: "",
  labelFilter: null,
  searchBodies: false,
  indexing: false,
};

const messageCache = new LRUCache(20);
const PARSE_VERSION = 3;

// --- DOM refs -----------------------------------------------------------------

const els = {
  file: document.getElementById("file"),
  dropzone: document.getElementById("dropzone"),
  q: document.getElementById("q"),
  searchBodies: document.getElementById("searchBodies"),
  status: document.getElementById("status"),
  bar: document.getElementById("bar"),
  meta: document.getElementById("meta"),
  navBoxes: document.getElementById("navBoxes"),
  labelChips: document.getElementById("labelChips"),
  list: document.getElementById("list"),
  vSubject: document.getElementById("vSubject"),
  vFrom: document.getElementById("vFrom"),
  vTo: document.getElementById("vTo"),
  vDate: document.getElementById("vDate"),
  vMsgId: document.getElementById("vMsgId"),
  vLabels: document.getElementById("vLabels"),
  vBanner: document.getElementById("vBanner"),
  htmlBox: document.getElementById("htmlBox"),
  textBox: document.getElementById("textBox"),
  htmlFrame: document.getElementById("htmlFrame"),
  vAtts: document.getElementById("vAtts"),
};

function updateStatus(txt) {
  els.status.textContent = txt;
}

const MAILBOXES = [
  { name: "Inbox", filter: (e) => e.labels.includes("Inbox") },
  { name: "Starred", filter: (e) => e.labels.includes("Starred") },
  { name: "Sent", filter: (e) => /\bSent\b/.test(e.labels.join(",")) },
  { name: "Drafts", filter: (e) => e.labels.includes("Drafts") },
  { name: "Spam", filter: (e) => e.labels.includes("Spam") },
  { name: "Trash", filter: (e) => e.labels.includes("Trash") },
  { name: "All Mail", filter: () => true },
];

function renderMailboxes() {
  els.navBoxes.innerHTML = "";
  MAILBOXES.forEach((b) => {
    const btn = document.createElement("button");
    btn.textContent = b.name;
    if (state.mailbox === b.name) btn.classList.add("active");
    const count = state.messages.filter(b.filter).length;
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = count;
    btn.appendChild(badge);
    btn.onclick = () => {
      state.mailbox = b.name;
      filterMessages();
    };
    els.navBoxes.appendChild(btn);
  });
}

function renderLabels() {
  els.labelChips.innerHTML = "";
  const skip = new Set(["Inbox", "Starred", "Sent", "Drafts", "Spam", "Trash"]);
  const labels = Array.from(state.labels.keys()).filter((l) => !skip.has(l)).sort();

  const all = document.createElement("div");
  all.className = "chip" + (state.labelFilter ? "" : " active");
  all.textContent = "All labels";
  all.onclick = () => {
    state.labelFilter = null;
    filterMessages();
  };
  els.labelChips.appendChild(all);

  labels.forEach((l) => {
    const c = document.createElement("div");
    c.className = "chip" + (state.labelFilter === l ? " active" : "");
    c.textContent = `${l} (${state.labels.get(l)})`;
    c.onclick = () => {
      state.labelFilter = state.labelFilter === l ? null : l;
      filterMessages();
    };
    els.labelChips.appendChild(c);
  });
}

function filterMessages() {
  const lowerQ = (state.query || "").toLowerCase();
  const box = MAILBOXES.find((b) => b.name === state.mailbox);
  const boxFilter = box ? box.filter : () => true;

  state.filtered = state.messages
    .filter((e) => {
      if (!boxFilter(e)) return false;
      if (state.labelFilter && !e.labels.includes(state.labelFilter)) return false;
      if (!lowerQ) return true;

      const hay = [
        e.subject,
        e.from,
        e.to,
        e.date,
        e.messageId,
        e.labels.join(" "),
        e.preview,
        e.attachmentFilenames.join(" "),
      ]
        .join("\n")
        .toLowerCase();

      if (hay.includes(lowerQ)) return true;

      // Body search is opt-in and uses cached messages only
      if (state.searchBodies) {
        const cached = messageCache.get(e.byteStart);
        if (cached?.content?.value?.toLowerCase().includes(lowerQ)) return true;
      }
      return false;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  renderList();
  renderMailboxes();
}

function renderList() {
  els.list.innerHTML = "";

  if (!state.filtered.length) {
    const empty = document.createElement("div");
    empty.className = "list-empty";
    empty.textContent = state.messages.length ? "No messages match filters." : "Open an .mbox file to begin.";
    els.list.appendChild(empty);
    return;
  }

  state.filtered.forEach((e) => {
    const row = document.createElement("div");
    row.className = "row" + (state.activeId === e.byteStart ? " active" : "");

    const left = document.createElement("div");
    const subj = document.createElement("div");
    subj.className = "subj";
    subj.textContent = e.subject || "(no subject)";
    subj.title = e.subject;

    const from = document.createElement("div");
    from.className = "from small";
    from.textContent = (e.from || "").replace(/\s*</, " <");

    const labs = document.createElement("div");
    labs.className = "labels-mini";
    e.labels.slice(0, 4).forEach((l) => {
      const p = document.createElement("span");
      p.className = "label-pill";
      p.textContent = l;
      labs.appendChild(p);
    });

    if (e.preview) {
      const sn = document.createElement("div");
      sn.className = "snippet";
      sn.textContent = e.preview;
      left.appendChild(subj);
      left.appendChild(sn);
    } else {
      left.appendChild(subj);
    }
    left.appendChild(from);
    left.appendChild(labs);

    const sizeCol = document.createElement("div");
    sizeCol.className = "size-col";
    sizeCol.textContent = formatSize(e.approximateSize);
    if (e.hasAttachments) sizeCol.textContent += " 📎";

    const right = document.createElement("div");
    right.className = "date";
    right.textContent = fmtDate(e.date);

    row.appendChild(left);
    row.appendChild(sizeCol);
    row.appendChild(right);
    row.onclick = () => openMessage(e);
    els.list.appendChild(row);
  });
}

function downloadAttachment(att) {
  let bytes;
  const enc = (att.encoding || "").toLowerCase();
  try {
    if (enc.includes("base64")) {
      bytes = b64ToUint8Array(att.rawEncoded);
    } else if (enc.includes("quoted-printable")) {
      bytes = new TextEncoder().encode(qpDecode(att.rawEncoded));
    } else {
      bytes = new TextEncoder().encode(att.rawEncoded);
    }
  } catch {
    bytes = new TextEncoder().encode(att.rawEncoded);
  }

  const blob = new Blob([bytes], { type: att.mime || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = att.filename || "attachment";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function renderParsedMessage(parsed, indexEntry) {
  els.vSubject.textContent = parsed.subject;
  els.vFrom.innerHTML = `<b>${esc(parsed.from || "")}</b>`;
  els.vTo.textContent = parseAddrs(parsed.to);
  els.vDate.textContent = fmtDate(parsed.date);
  els.vMsgId.textContent = parsed.messageId || "—";

  els.vLabels.innerHTML = "";
  parsed.labels.forEach((l) => {
    const c = document.createElement("div");
    c.className = "chip";
    c.textContent = l;
    els.vLabels.appendChild(c);
  });

  const LARGE = 5 * 1024 * 1024;
  if (indexEntry.approximateSize >= LARGE) {
    els.vBanner.className = "loading-banner warn";
    els.vBanner.textContent = `⚠ Large message (${formatSize(indexEntry.approximateSize)}). Rendering may be slow.`;
    els.vBanner.classList.remove("hidden");
  } else if (parsed.content.skipped) {
    els.vBanner.className = "loading-banner warn";
    els.vBanner.textContent = "⚠ Part of this message was too large to decode inline.";
    els.vBanner.classList.remove("hidden");
  } else {
    els.vBanner.classList.add("hidden");
  }

  if (parsed.content.kind === "html") {
    els.htmlBox.classList.remove("hidden");
    els.textBox.classList.add("hidden");

    let html = parsed.content.value || "";
    const plain = parsed.content.plainFallback || "";
    const rendered = renderHtmlInFrame(els.htmlFrame, html);

    if (!rendered || htmlLooksEmpty(html)) {
      if (plain.trim()) {
        els.htmlBox.classList.add("hidden");
        els.textBox.classList.remove("hidden");
        els.textBox.textContent = plain;
      } else if (!rendered) {
        els.htmlBox.classList.add("hidden");
        els.textBox.classList.remove("hidden");
        els.textBox.textContent = html.trim() || "[HTML body could not be rendered]";
      }
    }
  } else {
    els.htmlBox.classList.add("hidden");
    els.textBox.classList.remove("hidden");
    els.textBox.textContent = parsed.content.value;
  }

  els.vAtts.innerHTML = "";

  const atts =
    parsed.attachments.length > 0
      ? parsed.attachments
      : indexEntry.hasAttachments
        ? (indexEntry.attachmentFilenames.length
            ? indexEntry.attachmentFilenames.map((f) => ({
                filename: f,
                mime: "application/octet-stream",
                encoding: "",
                rawEncoded: null,
                detected: true,
              }))
            : [{ filename: "attachment detected", mime: "", encoding: "", rawEncoded: null, detected: true }])
        : [];

  if (atts.length) {
    const h = document.createElement("div");
    h.className = "small";
    h.style.margin = "0 0 8px 0";
    h.textContent = "Attachments";
    els.vAtts.appendChild(h);

    atts.forEach((a, i) => {
      const row = document.createElement("div");
      row.className = "att panel-surface";
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent =
        (a.filename || `attachment-${i + 1}`) +
        (a.mime ? ` · ${a.mime}` : "") +
        (a.sizeEstimate ? ` · ${formatSize(a.sizeEstimate)}` : "");

      row.appendChild(meta);

      if (a.rawEncoded && !a.detected) {
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = "Download";
        btn.onclick = () => downloadAttachment(a);
        row.appendChild(btn);
      } else {
        const tag = document.createElement("span");
        tag.className = "pill small";
        tag.textContent = a.detected ? "Detected" : "Unavailable";
        row.appendChild(tag);
      }

      els.vAtts.appendChild(row);
    });
  }
}

async function openMessage(indexEntry) {
  state.activeId = indexEntry.byteStart;
  renderList();

  els.vBanner.className = "loading-banner";
  els.vBanner.textContent = "Opening message…";
  els.vBanner.classList.remove("hidden");
  updateStatus("Opening message…");

  await yieldToMain();

  try {
    let parsed = messageCache.get(indexEntry.byteStart);

    if (!parsed) {
      const raw = await readMessage(state.file, indexEntry.byteStart, indexEntry.byteEnd);
      parsed = parseMessage(raw);
      parsed._v = PARSE_VERSION;
      messageCache.set(indexEntry.byteStart, parsed);
    } else if (parsed._v !== PARSE_VERSION) {
      const raw = await readMessage(state.file, indexEntry.byteStart, indexEntry.byteEnd);
      parsed = parseMessage(raw);
      parsed._v = PARSE_VERSION;
      messageCache.set(indexEntry.byteStart, parsed);
    }

    renderParsedMessage(parsed, indexEntry);
    updateStatus(`Indexed ${state.messages.length} messages`);
  } catch (err) {
    els.vBanner.className = "loading-banner warn";
    els.vBanner.textContent = `Failed to open message: ${err.message}`;
    console.error(err);
    updateStatus("Error opening message");
  }
}

// --- File loading -------------------------------------------------------------

async function handleFile(file) {
  if (!file) return;

  state.file = file;
  state.messages = [];
  state.filtered = [];
  state.activeId = null;
  state.query = "";
  state.labelFilter = null;
  state.mailbox = "All Mail";
  state.labels = new Map();
  state.indexing = true;
  messageCache.clear();

  els.q.value = "";
  els.vSubject.textContent = "Open an email";
  els.vFrom.innerHTML = "<b>—</b>";
  els.vTo.textContent = "—";
  els.vDate.textContent = "—";
  els.vMsgId.textContent = "—";
  els.vLabels.innerHTML = "";
  els.vBanner.classList.add("hidden");
  els.htmlBox.classList.add("hidden");
  els.textBox.classList.remove("hidden");
  els.textBox.textContent = "";
  els.vAtts.innerHTML = "";

  const t0 = performance.now();
  updateStatus("Indexing file…");
  els.bar.style.width = "0%";
  els.meta.textContent = `${formatSize(file.size)} · scanning…`;

  renderList();
  renderMailboxes();
  renderLabels();

  try {
    const messages = await indexMbox(file, ({ bytesRead, totalBytes, messageCount }) => {
      const pct = totalBytes ? Math.min(99, Math.round((bytesRead / totalBytes) * 100)) : 0;
      els.bar.style.width = `${pct}%`;
      els.meta.textContent = `${formatSize(file.size)} · ${messageCount} messages found…`;
      updateStatus(`Indexing file… ${pct}%`);
    });

    state.messages = messages;
    state.labels = new Map();
    messages.forEach((e) => {
      e.labels.forEach((l) => state.labels.set(l, (state.labels.get(l) || 0) + 1));
    });

    const ms = Math.max(1, Math.round(performance.now() - t0));
    els.bar.style.width = "100%";
    els.meta.textContent = `${messages.length} messages · ${formatSize(file.size)} · indexed in ${ms.toLocaleString()} ms`;
    updateStatus(`Indexed ${messages.length} messages`);

    filterMessages();
    renderLabels();
  } catch (err) {
    console.error(err);
    updateStatus(`Indexing failed: ${err.message}`);
    els.meta.textContent = "Error";
  } finally {
    state.indexing = false;
  }
}

// --- Events -------------------------------------------------------------------

els.file.addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (f) handleFile(f);
});

["dragenter", "dragover"].forEach((ev) =>
  els.dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    els.dropzone.style.borderColor = "var(--accent)";
  })
);

["dragleave", "drop"].forEach((ev) =>
  els.dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    els.dropzone.style.borderColor = "var(--muted)";
  })
);

els.dropzone.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files?.[0];
  if (f) handleFile(f);
});

els.q.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    state.query = els.q.value.trim();
    filterMessages();
  }
});

els.searchBodies.addEventListener("change", () => {
  state.searchBodies = els.searchBodies.checked;
  if (state.searchBodies && state.query) filterMessages();
});

// Initial render
renderMailboxes();
renderLabels();
renderList();
