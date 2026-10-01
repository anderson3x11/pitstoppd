// Client de l'API Pitstoppd (même origine, session par cookie httpOnly)
export async function api(path, { method = 'GET', body } = {}) {
  const isForm = body instanceof FormData
  const res = await fetch(`/api${path}`, {
    method,
    headers: body && !isForm ? { 'content-type': 'application/json' } : undefined,
    body: body && !isForm ? JSON.stringify(body) : body,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw Object.assign(new Error(data?.error ?? `Error ${res.status}`), { field: data?.field, status: res.status })
  return data
}
