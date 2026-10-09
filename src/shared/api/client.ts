export async function getJson(
  url: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error('Response contains invalid JSON');
  }
}
