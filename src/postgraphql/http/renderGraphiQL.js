import { readFileSync } from 'fs'
import { resolve } from 'path'

const html = readFileSync(resolve(__dirname, '../graphiql/index.html'), 'utf-8')

export default graphqlPath => {
  return html.replace(/{GRAPHQL_PATH}/, graphqlPath)
}
