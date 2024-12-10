import { request, sendXHR, XhrOptions } from "./request";

type PrismaField = {
  kind: string
  type: string
  name: string
  relationName?: string
  relationFromFields?: string[]
  isList: boolean
  default?: { name: string }
}

type PrismaModels = {
  models: { name: string, fields: PrismaField[], primaryKey: { fields: string[] } | null }[], 
  enums: { name: string, values: { name: string }[] }[]
}

export const utilsApi = {
  getModels: () => request<PrismaModels>("/api/admin/tables"),
  getHooks: () => request("/api/admin/hooks"),
  uploadFile: (file: File, options?: XhrOptions) => sendXHR("/api/admin/upload-file", file, options)
}