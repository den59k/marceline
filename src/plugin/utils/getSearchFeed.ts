
export const getSearchFeed = (str: string, dotToSpace: boolean = true): string[] => {
  const reg = dotToSpace ? /[_\-,()]/g : /[_\-.,()]/g;
  const arr = str
    .toLowerCase()
    .replace(reg, " ")
    .split(" ")
    .filter(a => a.length > 0);
  return arr;
};
