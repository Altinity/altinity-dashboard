export function fetchWithErrorHandling(url: string, method: string, body?: object,
                                       onSuccess?: (response: Response, body: object|string|undefined) => void,
                                       onFailure?: (response: Response, text: string, error: string) => void)
{
  const fetchInit: RequestInit = {
    method: method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  }
  if (body !== undefined) {
    fetchInit.body = JSON.stringify(body)
  }
  let response: Response
  let text: string
  let responseBody: object|string|undefined
  fetch(url, fetchInit)
  .then(resp => {
    response = resp
    return resp.text()
  })
  .then (t => {
    text = t
    if (!response.ok) {
      throw Error()
    }
    try {
      const content_type = response.headers.get("content-type")
      if (text && content_type && content_type.includes("application/json")) {
        responseBody = JSON.parse(text)
      } else {
        responseBody = text
      }
    } catch {
      throw Error(`JSON parsing error`)
    }
    if (onSuccess) {
      onSuccess(response, responseBody)
    }
  })
  .catch(error => {
    if (onFailure) {
      onFailure(response, text, error)
    }
  })
}
