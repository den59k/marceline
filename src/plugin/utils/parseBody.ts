import { traverseFormFields } from "../../frontend/utils/traverse";
import { Form } from "../types";

export const parseBody = (form: Form, body: any) => {
  const _body: Record<string, any> = {}
  traverseFormFields(form.fields, (item: any) => {
    if (!item.fieldId) return

    if (item.jsonField) {
      if (!_body[item.jsonField]) {
        _body[item.jsonField] = {}
      }
      if (item.fieldId in body) {
        _body[item.jsonField][item.fieldId] = body[item.fieldId]
      }
      return
    }

    if (item.fieldId in body) {
      _body[item.fieldId] = body[item.fieldId]
    }
    if (item.fileField && item.fileField in body) {
      if (item.format === "files-group") {
        _body[item.fieldId] = body[item.fileField].map((item: any) => item.id)
      } else {
        _body[item.fieldId] = body[item.fileField]?.id ?? null
      }
    }
  })

  return _body
}