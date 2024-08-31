import { request } from "./request";

type PrismaModels = {
  models: { name: string, fields: any[] }[], 
  enums: { name: string, values: { name: string }[] }[]
}

export const utilsApi = {
  getModels: () => request<PrismaModels>("/api/admin/tables"),
  getHooks: () => request("/api/admin/hooks")
}