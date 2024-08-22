import { request } from "./request"

export const dataApi = {

  getData: (viewId: string) => request(`/api/admin/data/${viewId}/items`),
  createElement: (viewId: string, values: any) => request(`/api/admin/data/${viewId}/items`, values),
  updateElement: (viewId: string, itemId: string, values: any) => request(`/api/admin/data/${viewId}/items/${itemId}`, values),
  deleteElements: (viewId: string, itemIds: string[]) => request(`/api/admin/data/${viewId}/items/${itemIds.join(",")}`, {}, { method: "DELETE" })
}