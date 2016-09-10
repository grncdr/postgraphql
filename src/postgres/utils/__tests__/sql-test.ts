import sql from '../sql'

test('raw will create a raw SQL item', () => {
  const text = 'abcdefg\'hijk-lmn"op'
  expect(sql.raw(text)).toEqual({ type: 'RAW', text })
})

test('identifier will create an identifier SQL item', () => {
  const name = 'abcdefg\'hijk-lmn"op'
  expect(sql.identifier(name)).toEqual({ type: 'IDENTIFIER', names: [name] })
})

test('identifier will create an identifier SQL item with multiple names', () => {
  const name1 = 'name1'
  const name2 = 'name2'
  const name3 = 'name3'
  expect(sql.identifier(name1, name2, name3)).toEqual({ type: 'IDENTIFIER', names: [name1, name2, name3] })
})

test('value will create an eager SQL value', () => {
  const value = Symbol('value')
  expect(sql.value(value)).toEqual({ type: 'VALUE_EAGER', value })
})

test('placeholder will create a lazy SQL value', () => {
  const name = 'name'
  expect(sql.placeholder(name)).toEqual({ type: 'VALUE_LAZY', name })
})

test('join will flatten singly nested arrays', () => {
  const item1 = Symbol('item1') as any
  const item2 = Symbol('item2') as any
  const item3 = Symbol('item3') as any
  const item4 = Symbol('item4') as any
  const item5 = Symbol('item5') as any
  expect(sql.join([item1, [item2, item3], item4, [item5]])).toEqual([item1, item2, item3, item4, item5])
})

test('join will add raw SQL seperators if supplied a string', () => {
  const seperator = Symbol('seperator') as any
  const item1 = Symbol('item1') as any
  const item2 = Symbol('item2') as any
  const item3 = Symbol('item3') as any
  expect(sql.join([item1, item2, item3], seperator))
    .toEqual([item1, sql.raw(seperator), item2, sql.raw(seperator), item3])
})

test('join will not add raw SQL seperators between nested arrays', () => {
  const seperator = Symbol('seperator') as any
  const item1 = Symbol('item1') as any
  const item2 = Symbol('item2') as any
  const item3 = Symbol('item3') as any
  const item4 = Symbol('item4') as any
  const item5 = Symbol('item5') as any
  expect(sql.join([item1, [item2, item3], item4, [item5]], seperator))
    .toEqual([item1, sql.raw(seperator), item2, item3, sql.raw(seperator), item4, sql.raw(seperator), item5])
})

test('query will output raw strings', () => {
  expect(sql.query`hello world`).toEqual([sql.raw('hello world')])
})

test('query will add items to the SQL', () => {
  const item1 = Symbol('item1') as any
  const item2 = Symbol('item2') as any
  const item3 = Symbol('item3') as any
  expect(sql.query`hello ${item1}${item2} world ${item3}`)
    .toEqual([sql.raw('hello '), item1, sql.raw(''), item2, sql.raw(' world '), item3, sql.raw('')])
})

test('query will flatten arrays of items', () => {
  const item1 = Symbol('item1') as any
  const item2 = Symbol('item2') as any
  const item3 = Symbol('item3') as any
  expect(sql.query`${[item1, item2, item3]}`).toEqual([sql.raw(''), item1, item2, item3, sql.raw('')])
})

test('compile will return an empty config for no items', () => {
  expect(sql.compile([])()).toEqual({
    name: undefined,
    text: '',
    values: [],
  })
})

test('compile will turn a raw text only query into a simple config', () => {
  expect(sql.compile([sql.raw('hello world')])()).toEqual({
    name: undefined,
    text: 'hello world',
    values: [],
  })
})

test('compile will add raw queries together', () => {
  expect(sql.compile([sql.raw('hello'), sql.raw(' '), sql.raw('world')])()).toEqual({
    name: undefined,
    text: 'hello world',
    values: [],
  })
})

test('compile will give the query a name if specified', () => {
  const name = 'name'
  expect(sql.compile(name, [])()).toEqual({
    name,
    text: '',
    values: [],
  })
})

test('compile will throw if a name and no SQL was given', () => {
  expect(() => sql.compile('name' as any)).toThrow()
})

test('compile will add identifiers as text strings', () => {
  expect(sql.compile([sql.identifier('hello')])()).toEqual({
    name: undefined,
    text: '"hello"',
    values: [],
  })
  expect(sql.compile([sql.identifier('a', 'b', 'c')])()).toEqual({
    name: undefined,
    text: '"a"."b"."c"',
    values: [],
  })
})

test('compile will remove double quotes in identifiers', () => {
  expect(sql.compile([sql.identifier('yo"yo')])()).toEqual({
    name: undefined,
    text: '"yoyo"',
    values: [],
  })
})

test('compile will throw an error when identifiers are an empty array', () => {
  expect(() => sql.compile([sql.identifier()])).toThrow()
})

test('compile will add identifiers to raw queries', () => {
  expect(sql.compile([sql.raw('hello '), sql.identifier('a', 'b', 'c'), sql.raw(' world')])()).toEqual({
    name: undefined,
    text: 'hello "a"."b"."c" world',
    values: [],
  })
})

test('compile will add value parameters for eager values', () => {
  const value = Symbol('value')
  expect(sql.compile([sql.value(value)])()).toEqual({
    name: undefined,
    text: '$1',
    values: [value],
  })
})

test('compile will add multiple value parameters for eager values', () => {
  const value1 = Symbol('value1')
  const value2 = Symbol('value2')
  const value3 = Symbol('value3')
  const value4 = Symbol('value4')
  expect(sql.compile([sql.value(value1), sql.value(value2), sql.raw(' '), sql.value(value3), sql.raw(' '), sql.value(value4)])()).toEqual({
    name: undefined,
    text: '$1$2 $3 $4',
    values: [value1, value2, value3, value4],
  })
})

test('compile will add null for lazy values', () => {
  expect(sql.compile([sql.placeholder('a')])()).toEqual({
    name: undefined,
    text: '$1',
    values: [null],
  })
  expect(sql.compile([sql.placeholder('a')])({})).toEqual({
    name: undefined,
    text: '$1',
    values: [null],
  })
})

test('compile will replace null with value if supplied lazily', () => {
  const a = Symbol('a')
  expect(sql.compile([sql.placeholder('a')])({ a })).toEqual({
    name: undefined,
    text: '$1',
    values: [a],
  })
})

test('compile with lazy values will work for many values', () => {
  const a = Symbol('a')
  const b = Symbol('b')
  const c = Symbol('c')
  const d = Symbol('d')
  expect(sql.compile([sql.placeholder('a'), sql.placeholder('b'), sql.raw(' '), sql.placeholder('c'), sql.raw(' '), sql.placeholder('d')])()).toEqual({
    name: undefined,
    text: '$1$2 $3 $4',
    values: [null, null, null, null],
  })
  expect(sql.compile([sql.placeholder('a'), sql.placeholder('b'), sql.raw(' '), sql.placeholder('c'), sql.raw(' '), sql.placeholder('d')])({ a, b, c, d })).toEqual({
    name: undefined,
    text: '$1$2 $3 $4',
    values: [a, b, c, d],
  })
})

test('compile with lazy values will work with some missing values', () => {
  const b = Symbol('b')
  const d = Symbol('d')
  expect(sql.compile([sql.placeholder('a'), sql.placeholder('b'), sql.raw(' '), sql.placeholder('c'), sql.raw(' '), sql.placeholder('d')])({ b, d })).toEqual({
    name: undefined,
    text: '$1$2 $3 $4',
    values: [null, b, null, d],
  })
})

test('compile with lazy values will work with extraneous values', () => {
  const a = Symbol('a')
  const b = Symbol('b')
  const c = Symbol('c')
  const d = Symbol('d')
  const e = Symbol('e')
  expect(sql.compile([sql.placeholder('a'), sql.placeholder('b'), sql.raw(' '), sql.placeholder('c'), sql.raw(' '), sql.placeholder('d')])({ a, b, c, d, e })).toEqual({
    name: undefined,
    text: '$1$2 $3 $4',
    values: [a, b, c, d],
  })
})

test('compile with lazy values will work with both extraneous and missing values', () => {
  const a = Symbol('a')
  const c = Symbol('c')
  const e = Symbol('e')
  expect(sql.compile([sql.placeholder('a'), sql.placeholder('b'), sql.raw(' '), sql.placeholder('c'), sql.raw(' '), sql.placeholder('d')])({ a, c, e })).toEqual({
    name: undefined,
    text: '$1$2 $3 $4',
    values: [a, null, c, null],
  })
})

test('compile with lazy values and compile with eager values will work together', () => {
  const a = Symbol('a')
  const b = Symbol('b')
  const c = Symbol('c')
  expect(sql.compile([sql.placeholder('a'), sql.value(b), sql.value(c)])({ a })).toEqual({
    name: undefined,
    text: '$1$2$3',
    values: [a, b, c],
  })
})

test('integration test 1', () => {
  expect(sql.compile(sql.query`hello ${sql.value(42)} world, ${sql.placeholder('a')} and ${[sql.raw('wow'), sql.raw(' '), sql.identifier('yo')]}`)({ a: 'cowabunga' })).toEqual({
    name: undefined,
    text: 'hello $1 world, $2 and wow "yo"',
    values: [42, 'cowabunga'],
  })
})