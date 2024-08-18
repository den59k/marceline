import { request } from "./request"

export const dataApi = {

  getData: (viewId: string) => request(`/api/data/${viewId}`)

}