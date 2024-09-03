export const filterHooks = (hooks: any[], systemTable: string) => {
  return hooks.filter((item: any) => {
    if (!item.table) return true
    return Array.isArray(item.table)? item.table.includes(systemTable): item.table === systemTable
  })
}