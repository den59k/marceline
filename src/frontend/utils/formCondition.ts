import { FormItem } from "../api/formsApi"

/** Проверяет, удволетворяет ли values заданному условию */
export const checkConditions = (item: FormItem, values: any): boolean => {
  if (!item.conditions) return true
  for (let c of item.conditions) {
    if (Array.isArray(c.field)) {
      if (!checkComplexCondition(values[c.field[0]], (c.field as string[]).slice(1), c.value)) {
        return false
      }
    } else {
      if (!checkSimpleCondition(c.value, values[c.field])) {
        return false
      }
    }
  }
  return true
}

export const checkSimpleCondition = (item: any, value: any): boolean => {
  if (Array.isArray(value)) {
    return value.includes(item)
  } else {
    return item === value
  }
}

export const checkComplexCondition = (item: any, path: string[], value: any): boolean => {
  if (path.length === 0) {
    return checkSimpleCondition(item, value)
  }
  if (!item) return false
  if (Array.isArray(item)) {
    for (let i of item) {
      if (checkComplexCondition(i, path, value)) {
        return true
      }
    }
  } else {
    return checkComplexCondition(item[path[0]], path.slice(1), value)
  }
  return false
}