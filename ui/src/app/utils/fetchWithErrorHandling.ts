export function fetchWithErrorHandling(url: string, method: string, body?: object,
                                       onSuccess?: (response: Response, body: object|undefined) => void,
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
      if (text) {
        body = JSON.parse(text)
      } else {
        body = {}
      }
    } catch {
      throw Error(`JSON parsing error`)
    }
    if (onSuccess) {
      onSuccess(response, body)
    }
  })
  .catch(error => {
    if (onFailure) {
      onFailure(response, text, error)
    }
  })
}
