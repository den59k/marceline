export const filterHooks = (hooks: any[], systemTable: string) => {
  const _systemTable = systemTable[0].toLowerCase() + systemTable.slice(1)
  return hooks.filter((item: any) => {
    if (!item.options?.table) return true
    return Array.isArray(item.options.table)? item.options.table.includes(_systemTable): item.options.table === _systemTable
  })
}