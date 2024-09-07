import { ViewColumn } from "../types";

type Select = Record<string, boolean | { select: Select, take?: number }>

export const generateSelect = (columns: ViewColumn[], postCallbacks: ((item: any) => void)[]) => {

  if (!columns || columns.length === 0) return {}

  const targetObject: Select = {}
  for (let column of columns) {

    if (column.format === "count") {
      targetObject["_count"] = { select: { [column.systemColumn]: true } }

      postCallbacks.push(item => {
        Object.assign(item, item._count)
        delete item._count
      })

      continue
    }

    const keys = column.systemColumn.split(".")
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