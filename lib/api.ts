export function jsonResponse(data: unknown, init?: ResponseInit) {
  return Response.json(data, init)
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}
