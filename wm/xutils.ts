import { Atom, IXClient } from "../shared/X";
import { ExtraAtoms } from "./wm";

export function internAtomAsync(X: IXClient, name: string): Promise<number> {
  return new Promise((resolve, reject) => {
    X.InternAtom(false, name, (err, atom) => {
      err ? reject(err) : resolve(atom);
    });
  });
}

export function getPropertyValue<TValue>(X: IXClient, wid: number, nameAtom: Atom, typeAtom: Atom): Promise<TValue> {
  return new Promise((resolve, reject) => {
    X.GetProperty(0, wid, nameAtom, typeAtom, 0, 10000000, function (err, prop) {
      if (err) {
        reject(err);
        return;
      }

      console.log("Got property value response", prop);

      switch (prop.type) {
        case X.atoms.STRING:
          resolve(prop.data.toString() as unknown as TValue);
          break;

        case ExtraAtoms.UTF8_STRING:
          resolve(prop.data.toString() as unknown as TValue);
          break;

        default:
          console.log("Unhandled atom property type", prop);
          resolve(undefined);
          break;
      }
    });
  });
}
