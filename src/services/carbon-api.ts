import { getJson } from '@/lib/http'

interface IntensityResponse {
  data: {
    from: string
    to: string
    intensity: {
      forecast: number
      actual: number | null
      index: string
    }
  }[]
}

// five values: safe in a class name, a data attribute, a URL.
export type Band = 'very-low' | 'low' | 'moderate' | 'high' | 'very-high'

const BANDS: { [apiIndex: string]: Band | undefined } = {
  'very low':  'very-low',
  'low':       'low',
  'moderate':  'moderate',
  'high':      'high',
  'very high': 'very-high',
}

export interface Reading {
  readonly value: number
  readonly basis: 'measured' | 'forecast'
  readonly band: Band
  readonly from: Date
  readonly to: Date
}

export async function fetchCurrentIntensity(): Promise<Reading> {
  const body = await getJson('https://api.carbonintensity.org.uk/intensity')
  const parsed = body as IntensityResponse   // still a lie — chapter 2

  const period = parsed.data[0]
  if (!period) throw new Error('The API returned no periods')

  const { actual, forecast, index } = period.intensity

  const band = BANDS[index]

  if (!band) throw new Error(`Unknown intensity index from API: "${index}"`)

  return {
    value: actual ?? forecast,
    basis: actual === null ? 'forecast' : 'measured',
    band,
    from: new Date(period.from),
    to: new Date(period.to),
  }
}