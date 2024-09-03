import { makeRequest } from "vuesix"
import { dataApi } from "../api/data"

export const getItems = async (systemTable: string) => {
  const resp = await makeRequest(dataApi.getDataByTable, systemTable)
  if (resp.length === 0) return []
  const item = resp[0]
  const keys = Object.keys(item)
  const titleKey = keys.find(item => item !== 'id' && item !== 'uuid') ?? keys[0]

  const idKey = keys.find(item => item !== titleKey) ?? keys[0]
  return resp.map((item: any) => ({ id: item[idKey], title: item[titleKey] }))
}