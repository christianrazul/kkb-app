interface ProblemDetails {
  detail?: string
  code?: string
}

interface CsrfResponse {
  headerName: string
  token: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message)
    this.status = status
    this.code = code
  }
}

let csrfPromise: Promise<CsrfResponse> | null = null

async function csrf(): Promise<CsrfResponse> {
  csrfPromise ??= request<CsrfResponse>('/api/auth/csrf')
  return csrfPromise
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (init.method && !['GET', 'HEAD', 'OPTIONS'].includes(init.method.toUpperCase())) {
    const token = await csrf()
    headers.set(token.headerName, token.token)
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'same-origin',
  })

  if (!response.ok) {
    const problem = await response.json().catch(() => ({})) as ProblemDetails
    throw new ApiError(problem.detail ?? `Request failed with status ${response.status}`, response.status, problem.code)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function resetCsrf(): void {
  csrfPromise = null
}
