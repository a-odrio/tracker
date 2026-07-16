async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.error === "string"
        ? body.error
        : body?.error
          ? JSON.stringify(body.error)
          : `Error ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export function apiGet<T>(url: string): Promise<T> {
  return fetch(url).then((res) => handle<T>(res));
}

export function apiPost<T>(url: string, data: unknown): Promise<T> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => handle<T>(res));
}

export function apiPatch<T>(url: string, data: unknown): Promise<T> {
  return fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => handle<T>(res));
}

export function apiDelete<T>(url: string): Promise<T> {
  return fetch(url, { method: "DELETE" }).then((res) => handle<T>(res));
}
