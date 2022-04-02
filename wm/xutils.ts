import { Atom, IXClient, XGetPropertyCallbackProps } from "../shared/X";
import { log } from "./log";
import { ExtraAtoms } from "./wm";

export function internAtomAsync(X: IXClient, name: string): Promise<number> {
  return new Promise((resolve, reject) => {
    X.InternAtom(false, name, (err, atom) => {
      err ? reject(err) : resolve(atom);
    });
  });
}

export async function getPropertyValue<TValue>(
  X: IXClient,
  wid: number,
  nameAtom: Atom,
  typeAtom: Atom
): Promise<TValue> {
  const prop = await getRawPropertyValue(X, wid, nameAtom, typeAtom);

  switch (prop.type) {
    case X.atoms.STRING:
      return prop.data.toString() as unknown as TValue;

    case ExtraAtoms.UTF8_STRING:
      return prop.data.toString() as unknown as TValue;

    default:
      log("Unhandled atom property type", prop);
      return undefined as unknown as TValue;
  }
}

export function getRawPropertyValue(
  X: IXClient,
  wid: number,
  nameAtom: Atom,
  typeAtom: Atom
): Promise<XGetPropertyCallbackProps> {
  return new Promise((resolve, reject) => {
    X.GetProperty(0, wid, nameAtom, typeAtom, 0, 10000000, function (err, prop) {
      if (err) {
        reject(err);
        return;
      }

      log("Got property value response", prop);
      resolve(prop);
    });
  });
}
