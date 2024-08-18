import { uid } from "uid"

export const getUniqueName = (base: string, cond: (name: string) => boolean) => {
  if (cond(base)) return base

  for (let i = 0; i < 10; i++) {
    if (cond(`${base}-${i}`)) return `${base}-${i}`
  }

  return `${base}-${uid(4)}`
}