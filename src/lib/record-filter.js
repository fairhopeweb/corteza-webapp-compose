import moment from 'moment'

// Generate record list sql query string based on filter object input

export function getRecordListFilterSql (filter) {
  let query = ''

  let existsPreviousElement = false
  filter.forEach(f => {
    if (f.name && f.operator) {
      if (existsPreviousElement) {
        query += ` ${f.condition} `
      }

      const fieldFilter = getFieldFilter(f.name, f.kind, f.value, f.operator)
      if (fieldFilter) {
        query += getFieldFilter(f.name, f.kind, f.value, f.operator)
        existsPreviousElement = true
      }
    }
  })

  return query ? `(${query})` : query
}

// Helper function that creates a query for a specific field kind
export function getFieldFilter (name, kind, query = '', operator = '=') {
  const boolQuery = toBoolean(query)
  const numQuery = Number.parseFloat(query)

  // Boolean should search for literal values. Example `${name} = true` or just `${name}
  // At the moment it doesn't seem to be working as intended

  if (kind === 'Bool') {
    const operation = operator === '=' ? 'is' : 'is not'
    if (boolQuery) {
      return `${name} ${operation} true`
    } else {
      return `${name} ${operation} false OR ${name} IS NULL`
    }
  }

  // Take care of special case where query is undefined and its not a Bool field
  if (!query) {
    if (operator === '=') {
      return `${name} IS NULL`
    } else if (operator === '!=') {
      return `${name} IS NOT NULL`
    }

    return undefined
  }

  // To SQLish LIKE param
  const strQuery = query
    // replace * with %
    .replace(/[*%]+/g, '%')
    // Remove all trailing * and %
    .replace(/[%]+$/, '')
    // Remove all leading * and %
    .replace(/^[%]+/, '')

  if (['Number'].includes(kind) && !isNaN(numQuery)) {
    if (operator === 'LIKE') {
      return `${name} LIKE '%${strQuery}%'`
    } else {
      return `${name} ${operator} ${numQuery}`
    }
  }

  if (['DateTime'].includes(kind)) {
    // Build different querries if date, time or datetime
    const date = moment(query, ['YYYY-MM-DDTHH:mm:ssZ', 'YYYY-MM-DD'])
    const time = moment(query, ['HH:mm'])

    // @note tweaking the template a bit:
    // * adding %f to include fractions; mysql sometimes forces them when formatting date
    // * changing Z to +00:00
    // * doing the same for time-only fields
    if (date.isValid()) {
      return `TIMESTAMP(DATE_FORMAT(${name}, '%Y-%m-%dT%H:%i:00.%f+00:00')) ${operator} TIMESTAMP(DATE_FORMAT('${date.format()}', '%Y-%m-%dT%H:%i:00.%f+00:00'))`
    } else if (time.isValid()) {
      return `TIME(DATE_FORMAT(${name}, '%Y-%m-%dT%H:%i:00.%f+00:00')) ${operator} TIME('${query}')`
    }
  }

  // Since userID and recordID must be numbers, we check if query is number to avoid wrong queries
  if (['User', 'Record'].includes(kind) && !isNaN(numQuery)) {
    return `${name} ${operator} '${query}'`
  }

  if (['String', 'Url', 'Select', 'Email'].includes(kind)) {
    if (operator === 'LIKE') {
      return `${name} LIKE '%${strQuery}%'`
    } else if (operator === '!=') {
      return `(${name} ${operator} '${strQuery}' OR ${name} is null)`
    } else {
      return `${name} ${operator} '${strQuery}'`
    }
  }
}

// Helper to determine if and value for given bool query
// == is intentional
const toBoolean = (v) => {
  /* eslint-disable eqeqeq */
  if (v == 'false' || v == 0) {
    return false
  }
  if (v == 'true' || v == 1) {
    return true
  }

  return undefined
}

// Takes fields and prefilter and record list filter and merges them into query string
// ie: Return records that have strings in columns (fields) we're showing that start with <query> in case
//     of text or are exactly the same in case of numbers
export function queryToFilter (searchQuery = '', prefilter = '', fields = [], recordListFilter = []) {
  searchQuery = (searchQuery || '').trim()

  // Create query for search string
  if (searchQuery) {
    searchQuery = fields
      .map(qf => getFieldFilter(qf.name, qf.kind, searchQuery, 'LIKE'))
      .filter(q => !!q)
      .join(' OR ')

    searchQuery = searchQuery ? `(${searchQuery})` : ''
  }

  const recordListFilterSqlArray = recordListFilter.map(({ groupCondition, filter = [] }) => {
    groupCondition = groupCondition ? ` ${groupCondition} ` : ''
    filter = getRecordListFilterSql(filter)

    return filter ? `${filter}${groupCondition}` : ''
  }).filter(filter => filter)

  // Trim AND/OR from end of string
  let recordListFilterSql = trimChar(trimChar(recordListFilterSqlArray.join(''), ' AND '), ' OR ')

  // If filter exists, wrap with ()
  recordListFilterSql = recordListFilterSqlArray.length > 1 ? `(${recordListFilterSql})` : recordListFilterSql

  return [prefilter, searchQuery, recordListFilterSql].filter(f => f).join(' AND ')
}

// Evaluates the given prefilter. Allows JS template literal expressions
// such as id = ${recordID}
export function evaluatePrefilter (prefilter, { record, recordID, ownerID, userID }) {
  return (function (prefilter) {
    /* eslint-disable no-eval */
    return eval('`' + prefilter + '`')
  })(prefilter)
}

// Removes char from end of string
function trimChar (text = '', char = '') {
  if (text.substring(text.length - char.length, text.length) === char) {
    text = text.substring(0, text.length - char.length)
  }
  return text
}
