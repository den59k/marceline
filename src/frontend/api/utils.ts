import { request } from "./request";

export const utilsApi = {
  getModels: () => request<{ models: any[] }>("/api/tables")
}