import { PrismaClient } from "@prisma/client";

export const insertWithOrder = async (prisma: PrismaClient, model: string, orderField: string, ids: any[], data: any, idField: { name: string, type: string }) => {

  // (id, order)
  const placeholders = ids
    .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2}::float)`)
    .join(', ');

  const params = ids.flatMap((id, i) => [id, i + 1]);

  // поля из data
  const dataEntries = Object.entries(data);

  // начинаем нумерацию после params
  let paramIndex = params.length;

  const dataSetSql = dataEntries
    .map(([key, val]) => {
      paramIndex++;
      params.push(val);
      return `"${key}" = $${paramIndex}`;
    })
    .join(',\n  ');

  await prisma.$executeRawUnsafe(`
    UPDATE "${model}" t
    SET
      "${orderField}" = v.pos,
      ${dataSetSql}
    FROM (VALUES ${placeholders}) AS v(id, pos)
    WHERE 
      t."${idField.name}" = v.id
      AND t."${idField.name}" IN (${ids.map((_, i) => `$${i * 2 + 1}`).join(', ')})
  `, ...params);
}