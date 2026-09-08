import { getJson } from "@/lib/http";

interface IntensityResponse {
  data: {
    from: string;
    to: string;
    intensity: {
      forecast: number;
      actual: number | null;
      index: string;
    };
  }[];
}

export interface Reading {
  readonly value: number;
  readonly basis: "measured" | "forecast";
  readonly index: string;
  readonly from: Date;
  readonly to: Date;
}

export async function fetchCurrentIntensity() {
  const body = await getJson("https://api.carbonintensity.org.uk/intensity");

  const parsed = body as IntensityResponse;

  const period = parsed.data[0];
  if (!period) throw new Error("The API returned no periods");

  const { actual, forecast, index } = period.intensity;

  return {
    value: actual ?? forecast,
    basis: actual === null ? "forecast" : "measured",
    index,
    from: new Date(period.from),
    to: new Date(period.to),
  };
}
