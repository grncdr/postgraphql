import { PGCatalog, PGCatalogProcedure, PGCatalogClass } from '../../../postgres/introspection'

/**
 * Checks if a Postgres procedure can be a computed column. That is if the
 * procedure’s first argument is a composite type, and the name starts with
 * that type’s name. So for example:
 *
 * ```sql
 * create function person_full_name(person person) returns text as ...;
 * ```
 *
 * Would be a computed column because it takes a composite type as the first
 * argument (`person`), and the name starts with the composite type’s name
 * (`person_`).
 *
 * If the optional third argument is provided this function will check if this
 * is a computed column *for that class*.
 */
// TODO: test
export default function isPGProcedureComputedColumn (
  pgCatalog: PGCatalog,
  pgProcedure: PGCatalogProcedure,
  pgClass?: PGCatalogClass,
): boolean {
  // If there are no arguments for this procedure, this is not a computed
  // column.
  if (pgProcedure.argTypeIds.length === 0)
    return false

  const firstArgTypeId = pgProcedure.argTypeIds[0]
  const pgType = pgCatalog.assertGetType(firstArgTypeId)

  // If the procedure and type are in different namespaces, this is not a
  // computed column.
  if (pgProcedure.namespaceId !== pgType.namespaceId)
    return false

  // If the first argument type is not a composite type, this is not a
  // computed column.
  if (pgType.type !== 'c')
    return false

  // If the procedure’s name does not start with the first argument’s
  // composite type name, this is not a computed column.
  if (!pgProcedure.name.startsWith(`${pgType.name}_`))
    return false

  // If we were given a `pgClass` parameter, and the first argument’s composite
  // type is not for this class, this is not a computed column for that class.
  if (pgClass && pgType.classId !== pgClass.id)
    return false

  // Otherwise, this is a computed column!
  return true
}
