import { Prisma } from "@prisma/client"
import { View } from "../types"

export const getIdField = (form: Pick<View, "idField" | "systemTable">): { name: string, type: string } => {
  const systemTable = Prisma.dmmf.datamodel.models.find(item => item.name === form.systemTable)
  if (form.idField) {
    const idField =  systemTable?.fields.find(item => item.name === form.idField)
    if (!idField) throw Error(`Unable to find ID field ${form.idField} in table ${systemTable?.name}`)
    return idField
  }

  const idField = systemTable?.fields.find(item => item.isId)
  if (!idField) throw Error(`Unable to find ID field in table ${form.systemTable}`)
  return idField
}

export const getSelect = (systemTable: string) => {
  
}

export const parseIdField = (idField: { type: string }, value: string) => {
  if (idField.type === "Int") {
    return parseInt(value)
  }
  if (idField.type === "BigInt") {
    return BigInt(value)
  }
  return value
}