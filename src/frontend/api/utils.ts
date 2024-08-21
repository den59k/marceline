import { request } from "./request";

export const utilsApi = {
  getModels: () => request<{ models: any[] }>("/api/admin/tables"),
  getHooks: () => request("/api/admin/hooks")
}