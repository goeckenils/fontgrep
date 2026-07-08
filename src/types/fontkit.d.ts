// Minimal ambient declaration for fontkit (no bundled types).
declare module "fontkit" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function create(buffer: Buffer | Uint8Array): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function open(path: string): any;
}
