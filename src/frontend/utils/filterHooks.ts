export const filterHooks = (hooks: any[], systemTable: string) => {
  return hooks.filter((item: any) => {
    if (!item.options?.table) return true
    return Array.isArray(item.options.table)? item.options.table.includes(systemTable): item.options.table === systemTable
  })
}