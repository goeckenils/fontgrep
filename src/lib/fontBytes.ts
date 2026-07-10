/** True when buffer begins with a known sfnt / webfont signature. */
export function isFontBytes(buffer: ArrayBuffer | Uint8Array): boolean {
  const view =
    buffer instanceof ArrayBuffer ? new DataView(buffer) : new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  if (view.byteLength < 4) return false;
  const sig = view.getUint32(0, false);
  return (
    sig === 0x00010000 ||
    sig === 0x4f54544f ||
    sig === 0x774f4646 ||
    sig === 0x774f4632
  );
}

/** GitHub sometimes returns 200 with an HTML/text stub instead of a font. */
export function isFontErrorBody(buffer: ArrayBuffer | Uint8Array): boolean {
  const bytes =
    buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer)
      : buffer;
  if (bytes.byteLength === 0) return true;
  const head = new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.byteLength, 96)));
  if (head.startsWith("No Content:")) return true;
  if (head.includes("<!DOCTYPE") || head.includes("<html")) return true;
  if (head.trimStart().startsWith("{") && head.includes('"error"')) return true;
  return false;
}

export function isValidFontBuffer(buffer: ArrayBuffer | Uint8Array): boolean {
  if (buffer.byteLength < 80) return false;
  if (isFontErrorBody(buffer)) return false;
  return isFontBytes(buffer);
}