import { base64 } from "rfc4648";

export function encodeArrayBufferToBase64(buffer: ArrayBufferLike): string {
  return base64.stringify(new Uint8Array(buffer));
}

export function decodeBase64ToArrayBuffer(str: string): ArrayBufferLike {
  return base64.parse(str).buffer;
}
