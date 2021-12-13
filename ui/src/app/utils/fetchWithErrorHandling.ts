export function fetchWithErrorHandling(url: string, method: string, body?: object,
                                       onSuccess?: (response: Response, body: object|string|undefined) => number|void,
                                       onFailure?: (response: Response, text: string, error: string) => number|void,
                                       onCheckDelay?: () => number)
{
  if (onCheckDelay) {
    // Check if we should delay retrieving, perhaps because our tab isn't in focus.  The callback should return:
    // 0 = proceed as normal
    // positive number = delay this long, then resume normal checking
    // negative number = cancel, stop repeating
    const interval = onCheckDelay()
    if (interval > 0) {
      setTimeout(() => fetchWithErrorHandling(url, method, body, onSuccess, onFailure, onCheckDelay), interval)
      return
    }
    if (interval < 0) {
      return
    }
  }
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
      const interval = onSuccess(response, responseBody)
      if (interval) {
        setTimeout(() => fetchWithErrorHandling(url, method, body, onSuccess, onFailure, onCheckDelay), interval)
      }
    }
  })
  .catch(error => {
    if (onFailure) {
      const interval = onFailure(response, text, error)
      if (interval) {
        setTimeout(() => fetchWithErrorHandling(url, method, body, onSuccess, onFailure, onCheckDelay), interval)
      }
    }
  })
}
