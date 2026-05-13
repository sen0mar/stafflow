import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

type QueryValue = number | string | undefined
type QueryState = Record<string, QueryValue>

const getValue = (
  searchParams: URLSearchParams,
  key: string,
  fallback: string,
) => searchParams.get(key) ?? fallback

export const getQueryString = (
  searchParams: URLSearchParams,
  key: string,
  fallback = '',
) => getValue(searchParams, key, fallback)

export const getQueryNumber = (
  searchParams: URLSearchParams,
  key: string,
  fallback: number,
) => {
  const value = Number(searchParams.get(key))

  return Number.isFinite(value) && value > 0 ? value : fallback
}

export const getQueryDate = (searchParams: URLSearchParams, key: string) =>
  getQueryString(searchParams, key)

export const setQueryState = (
  previousParams: URLSearchParams,
  values: QueryState,
) => {
  const nextParams = new URLSearchParams(previousParams)

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === 'all') {
      nextParams.delete(key)
      return
    }

    nextParams.set(key, String(value))
  })

  return nextParams
}

export const useTableQueryState = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const updateQuery = useCallback(
    (values: QueryState, options: { resetPage?: boolean } = {}) => {
      setSearchParams(
        (previousParams) => {
          const nextParams = setQueryState(previousParams, {
            ...values,
            ...(options.resetPage ? { page: undefined } : {}),
          })

          return nextParams
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const getDateValue = useCallback(
    (key: string) => getQueryDate(searchParams, key),
    [searchParams],
  )
  const getNumberValue = useCallback(
    (key: string, fallback: number) =>
      getQueryNumber(searchParams, key, fallback),
    [searchParams],
  )
  const getStringValue = useCallback(
    (key: string, fallback = '') => getQueryString(searchParams, key, fallback),
    [searchParams],
  )

  return {
    getDate: getDateValue,
    getNumber: getNumberValue,
    getString: getStringValue,
    searchParams,
    updateQuery,
  }
}
