import { PrismaClient } from "@prisma/client";
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

export const attachFiles = async (prisma: PrismaClient, filesTable: string, items: any, fileFields: { fileIdField: string, fieldId: string }[]) => {
  const fileIds: string[] = []
  for (let item of items) {
    for (let field of fileFields) {
      if (!item[field.fileIdField!]) continue
      if (Array.isArray(item[field.fileIdField!])) {
        fileIds.push(...item[field.fileIdField!])
        item[field.fieldId!] = []
      } else {
        fileIds.push(item[field.fileIdField!])
        item[field.fieldId!] = null
      }
    }
  }
  if (fileIds.length > 0) {
    const files = await (prisma as any)[filesTable].findMany({
      where: { id: { in: fileIds }}
    })
    const filesMap = new Map(files.map((item: any) => [ item.id, item ]))
    for (let item of items) {
      for (let field of fileFields) {
        if (!item[field.fileIdField!]) continue
        if (Array.isArray(item[field.fileIdField!])) {
          item[field.fieldId!] = item[field.fileIdField!].map((item: string) => filesMap.get(item))
        } else {
          item[field.fieldId!] = filesMap.get(item[field.fileIdField!]) ?? null
        }
      }
    }
  }
  
}