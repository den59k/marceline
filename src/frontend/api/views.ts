import { request } from "./request";

export const viewsApi = {
  getViews: () => request("/api/admin/views"),
  getView: (viewId: string) => request(`/api/admin/views/${viewId}`),
  createView: (values: any) => request("/api/admin/views", values),
  updateView: (viewId: string, values: any) => request(`/api/admin/views/${viewId}`, values)
}