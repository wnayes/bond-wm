
export function anyIntersect<T>(arr1: T[] | null | undefined, arr2: T[] | null | undefined): boolean {
    if (!arr1 || !arr2) {
        return false;
    }
    for (const item1 of arr1) {
        for (const item2 of arr2) {
            if (item1 === item2) {
                return true;
            }
        }
    }
    return false;
}
