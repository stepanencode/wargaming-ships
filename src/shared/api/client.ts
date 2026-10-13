import { measure } from '../monitoring/sentry';

export async function getJson(
  url: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  try {
    // The automatic fetch span ends at response headers; this covers body download and JSON parsing.
    return await measure(`GET ${url} body`, 'http.body', () => response.json());
  } catch {
    throw new Error('Response contains invalid JSON');
  }
}
