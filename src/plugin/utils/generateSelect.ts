import { ViewColumn } from "../types";

type Select = Record<string, boolean | { select: Select }>

export const generateSelect = (columns: ViewColumn[]) => {

  if (!columns || columns.length === 0) return undefined

  const targetObject: Select = {}
  for (let item of columns) {

    if (item.format === "count") {
      targetObject["_count"] = { select: { [item.systemColumn]: true } }
      continue
    }

    const keys = item.systemColumn.split(".")
    let targetObj = targetObject
    for (let i = 0; i < keys.length-1; i++) {
      if (!targetObj[keys[i]] || typeof targetObj[keys[i]] === "boolean") {
        targetObj[keys[i]] = { select: {} }
      }

      targetObj = (targetObj[keys[i]] as { select: Select }).select
    }
    targetObj[keys[keys.length-1]] = true
  }

  return targetObject
}