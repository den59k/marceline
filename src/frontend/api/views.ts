import { request } from "./request";

export const viewsApi = {
  getViews: () => request("/api/views"),
  createView: (values: any) => request("/api/views", values),
  updateView: (viewId: string, values: any) => request(`/api/views/${viewId}`, values)
}