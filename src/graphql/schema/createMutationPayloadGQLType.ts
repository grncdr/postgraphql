import { GraphQLString, GraphQLObjectType, GraphQLFieldConfig } from 'graphql'
import { formatName, buildObject } from '../utils'
import BuildToken from './BuildToken'
import { MutationValue } from './createMutationGQLField'
import getQueryGQLType from './getQueryGQLType'

/**
 * Creates the payload type for a GraphQL mutation. Uses the provided output
 * fields and adds a `clientMutationId` and `query` field.
 */
export default function createMutationPayloadGQLType <T>(
  buildToken: BuildToken,
  config: {
    name: string,
    outputFields?: Array<[string, GraphQLFieldConfig<T, mixed>] | false | null | undefined>,
  },
): GraphQLObjectType<MutationValue<T>> {
  return new GraphQLObjectType<MutationValue<T>>({
    name: formatName.type(`${config.name}-payload`),
    // TODO: description
    fields: buildObject<GraphQLFieldConfig<MutationValue<T>, mixed>>(
      [
        // Add the `clientMutationId` output field. This will be the exact
        // same value as the input `clientMutationId`.
        ['clientMutationId', {
          // TODO: description
          type: GraphQLString,
          resolve: ({ clientMutationId }) => clientMutationId,
        }],
      ],
      // Add all of our output fields to the output object verbatim. Simple
      // as that. We do transform the fields to mask the implementation
      // detail of `MutationValue` being an object. Instead we just pass
      // `MutationValue#value` directly to the resolver.
      (config.outputFields || [])
        .filter(Boolean)
        .map<[string, GraphQLFieldConfig<MutationValue<T>, mixed>]>(
          ([fieldName, field]: [string, GraphQLFieldConfig<T, mixed>]) =>
            [fieldName, <GraphQLFieldConfig<MutationValue<T>, mixed>> {
              type: field.type,
              args: field.args,
              resolve: field.resolve ? ({ value }: MutationValue<T>, ...rest: Array<any>) => (field as any).resolve(value, ...rest) : null,
              description: field.description,
              deprecationReason: field.deprecationReason,
            }]
        ),
      [
        // A reference to the root query type. Allows you to access even more
        // data in your mutations.
        ['query', {
          // TODO: description
          type: getQueryGQLType(buildToken),
          resolve: () => null,
        }],
      ],
    ),
  })
}