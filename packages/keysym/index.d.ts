export interface IKeySym {
  keysym: number;
  unicode: number;
  status: string;
  names: string[];
}

export const records: IKeySym[];

export function fromKeysym(keysym: number): IKeySym | null | undefined;
export function fromUnicode(code: number | string): IKeySym | null | undefined;
export function keyEvent(code: number, shiftMask: number): string | null | undefined;
export function fromName(name: string): IKeySym | null | undefined;
