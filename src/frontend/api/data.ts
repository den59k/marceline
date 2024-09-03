import { query } from "vuesix"
import { request } from "./request"

type Options = {
  page?: number
}

export const dataApi = {
  getDataByTable: (systemTable: string) => request(`/api/admin/raw-data/${systemTable}`),
  
  getData: (viewId: string, options: Options) => request(`/api/admin/data/${viewId}/items${query(options)}`),
  createElement: (viewId: string, values: any) => request(`/api/admin/data/${viewId}/items`, values),
  updateElement: (viewId: string, itemId: string, values: any) => request(`/api/admin/data/${viewId}/items/${itemId}`, values),
  deleteElements: (viewId: string, itemIds: string[]) => request(`/api/admin/data/${viewId}/items/${itemIds.join(",")}`, {}, { method: "DELETE" })
}