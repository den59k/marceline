import { request } from "./request";

export type Endpoint = {
  id: string,
  name: string,
  path: string
}

export const endpointsApi = {
  getAll: () => request<Endpoint[]>("/api/admin/endpoints"),
  getEndpoint: (formId: string | null) => request<Endpoint>(`/api/admin/endpoints/${formId}`),

  createEndpoint: (values: any) => request("/api/admin/endpoints", values),
  updateEndpoint: (itemId: string, values: any) => request(`/api/admin/endpoints/${itemId}`, values),
  deleteEndpoint: (itemId: string) => request(`/api/admin/endpoints/${itemId}`, {}, { method: "DELETE" })
}