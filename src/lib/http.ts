/**
 Thrown when the server replied, but with a failure status.
 A custom class lets calling code ask `error instanceof HttpError`
 and read `.status`, instead of trying to parse a message string.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(status: number, url: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.url = url;
  }
}

export async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;

    throw new HttpError(
      response.status,
      url,
      body?.error?.message ?? `Request failed with status ${response.status}`,
    );
  }

  return response.json();
}
