/** Returns a copy of `items` with the element at `from` moved to `to`. */
export function move<T>(items: T[], from: number, to: number): T[] {
    if (to < 0 || to >= items.length || from === to) return items;
    const copy = [...items];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
}

export function removeAt<T>(items: T[], index: number): T[] {
    return items.filter((_, i) => i !== index);
}
