
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

export async function fetchCurrentIntensity() {
  const body = await getJson('https://api.carbonintensity.org.uk/intensity')

  const parsed = body as IntensityResponse

  const period = parsed.data[0]
  if (!period) throw new Error('The API returned no periods')

  return period
}