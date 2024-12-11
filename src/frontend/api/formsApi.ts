import { request } from "./request";

export type Form = {
  id: string,
  name: string,
  systemTable: string,
  idField: string,
  fields: FormItem[]
}

export type FormItem = {
  format?: string,
  enum?: { id: string, title: string }[],
  fieldId?: string,
  name?: string, 
  initialLatLng?: string,
  placeholder?: string,
  fileIdField?: string,
  jsonField?: string,
  isCustom?: boolean,
  modifiers?: string[],
  relationType?: string,
  relationBridgeType?: string,
  relationBridgeFieldId?: string,
  aliasFieldId?: string,
  multiple?: boolean,
  value?: any,
  children?: FormItem[]
  columns?: Array<{ fieldId: string, name: string, type: string, enum?: { id: string, title: string }[], enabled: boolean }>
}

export const formsApi = {
  getAll: () => request<Form[]>("/api/admin/forms"),
  getForm: (formId: string | null) => request<Form>(`/api/admin/forms/${formId}`),

  createForm: (values: any) => request("/api/admin/forms", values),
  updateForm: (formId: string, values: any) => request(`/api/admin/forms/${formId}`, values),
  deleteForm: (formId: string) => request(`/api/admin/forms/${formId}`, {}, { method: "DELETE" })
}