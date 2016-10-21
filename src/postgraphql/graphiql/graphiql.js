import React from 'react'
import { render } from 'react-dom'
import GraphiQL from 'graphiql'
import { buildClientSchema, introspectionQuery } from 'graphql'
import 'graphiql/graphiql.css'

class EnhancedGraphiQL extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      schema: undefined,
      token: undefined,
    }
  }

  componentWillMount() {
    setupStream({
      onChange: this.onChange,
      onOpen: this.onOpen,
      onError: this.onError,
    })
  }

  render() {
    return (
      <GraphiQL schema={this.state.schema} fetcher={this.fetcher}>
        <GraphiQL.Logo>PostGraphQL GraphiQL</GraphiQL.Logo>
        <GraphiQL.Footer>
          <input onBlur={this.onTokenSet}/>
        </GraphiQL.Footer>
      </GraphiQL>
    )
  }

  onTokenSet = event => {
    this.setState({ token: event.target.value })
  }

  onChange = event => {
    this.fetcher({ query: introspectionQuery })
      .then(result => buildClientSchema(result.data))
      .then(schema => this.setState({ schema: schema }))
      .then(() => console.log('PostGraphQL: Schema updated.'))
  }

  onOpen = event => {
    console.log('PostGraphQL: Listening to schema changes.')
  }

  onError = event => {
    console.log('PostGraphQL: There was an error while listening to changes. Attempting to reconnect.')
  }

  fetcher = graphQLParams => {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }

    if (this.state.token)
      headers['Authorization'] = `Bearer: ${this.state.token}`

    return fetch(this.props.graphqlPath, {
      method: 'POST',
      headers,
      body: JSON.stringify(graphQLParams),
      credentials: 'include',
    })
      .then(response => response.text())
      .then(responseBody => {
        try {
          return JSON.parse(responseBody)
        } catch (error) {
          return responseBody
        }
      })
  }
}

const setupStream = ({
  onOpen,
  onChange,
  onError
}) => {
  // Starts listening to the event stream
  const source = new EventSource('/_postgraphql/stream')
  // Setup listeners for specific events
  source.addEventListener('changed', event => onChange(event), false)
  source.addEventListener('open', event => onOpen(event), false)
  source.addEventListener('error', event => onError(event), false)
}

(function renderGraphiQL() {
  const { GRAPHQL_PATH } = window
  render(
    <EnhancedGraphiQL graphqlPath={GRAPHQL_PATH}/>,
    document.getElementById('root')
  )
})()
