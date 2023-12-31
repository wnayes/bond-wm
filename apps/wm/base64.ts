import { base64 } from "rfc4648";

export function encodeArrayBufferToBase64(buffer: ArrayBuffer): string {
  return base64.stringify(new Uint8Array(buffer));
}

export function decodeBase64ToArrayBuffer(str: string): ArrayBuffer {
  return base64.parse(str).buffer;
}
