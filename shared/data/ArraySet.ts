type BackingDataMap = Map<unknown, BackingDataMap | boolean>;

/**
 * Set that holds arrays as entries, where an array `[a, b, c]` is considered to
 * be in the set if some other array `[x, y, z]` is already present such that
 * `a === x && b === y && c === z`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ArraySet<TArray extends ReadonlyArray<any>> {
  private _data: BackingDataMap = new Map();

  /** Adds an array to the set. */
  public add(array: TArray): this {
    const len = array.length;
    let currentData: BackingDataMap | boolean | undefined = this._data;
    for (let i = 0; i < len - 1; i++) {
      const value = array[i];
      let nextData: BackingDataMap | boolean | undefined = (currentData as BackingDataMap).get(value);
      if (nextData === true) {
        throw new Error("ArraySet entries cannot be subsets of one another.");
      }
      if (!nextData) {
        nextData = new Map();
        (currentData as BackingDataMap).set(value, nextData);
      }
      currentData = nextData;
    }

    const lastValue = array[len - 1];
    currentData.set(lastValue, true);

    return this;
  }

  /** Tests if an array is in the set. */
  public has(array: TArray): boolean {
    const len = array.length;
    let currentData: BackingDataMap | boolean | undefined = this._data;
    for (let i = 0; i < len - 1; i++) {
      const value = array[i];
      const nextData: BackingDataMap | boolean | undefined = (currentData as BackingDataMap).get(value);
      if (typeof nextData === "undefined" || nextData === true) {
        return false;
      }
      currentData = nextData;
    }

    const lastValue = array[len - 1];
    return (currentData as BackingDataMap).get(lastValue) === true;
  }
}
