import { request } from "./request";

type PrismaField = {
  kind: string
  type: string
  name: string
  relationName?: string
  isList: boolean
}

type PrismaModels = {
  models: { name: string, fields: PrismaField[] }[], 
  enums: { name: string, values: { name: string }[] }[]
}

export const utilsApi = {
  getModels: () => request<PrismaModels>("/api/admin/tables"),
  getHooks: () => request("/api/admin/hooks")
}