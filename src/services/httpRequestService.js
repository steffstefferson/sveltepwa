export function makeRequest(url, method, body) {
  var request = new XMLHttpRequest()
  return new Promise(function (resolve, reject) {
    request.onreadystatechange = function () {
      if (request.readyState !== 4) return
      if (request.status >= 200 && request.status < 300) {
        resolve(request)
      } else {
        reject({
          status: request.status,
          statusText: request.statusText || request.responseText,
        })
      }
    }
    request.open(method || 'GET', url, true)
    body ? request.send(body) : request.send()
  })
}
export function makeJsonRequest(url, method, jsonObj) {
  var request = new XMLHttpRequest()
  return new Promise(function (resolve, reject) {
    request.onreadystatechange = function () {
      if (request.readyState !== 4) return
      if (request.status >= 200 && request.status < 300) {
        resolve({ request, content: JSON.parse(request.responseText) })
      } else {
        reject({
          status: request.status,
          statusText: request.statusText || request.responseText,
        })
      }
    }
    request.open(method || 'GET', url, true)
    request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    jsonObj ? request.send(JSON.stringify(jsonObj)) : request.send()
  })
}
