import { makeJsonRequest } from './httpRequestService'

let registerPushUrl =
  'https://us-central1-burning-inferno-892.cloudfunctions.net/registerPush'
let unregisterPushUrl =
  'https://us-central1-burning-inferno-892.cloudfunctions.net/unregisterPush'

export async function disablePush() {
  try {
    var subscription = await getCurrentSubscription()
    if (subscription == null) {
      return { sucess: true, msg: 'Push notifications disabled!' }
    }
    await deleteSubscriptionAtBackEnd(subscription)
    return { sucess: true, msg: 'Push notifications disabled!' }
  } catch (err) {
    console.log('Error on Push notifications disable', err)
    return { sucess: false, msg: 'Error on Push notifications disable' }
  }
}

export async function enablePush() {
  try {
    let permissionResult = await askPushPermission()
    if (permissionResult !== 'granted') {
      return {
        success: false,
        msg: "Nope! Didn't work, ask Lurin how to solve this problem",
      }
    }
    let subscribeResult = await subscribeUserToPush()
    let parsedResult = JSON.parse(JSON.stringify(subscribeResult))

    await sendSubscriptionToBackEnd(parsedResult)
    return { success: true, msg: 'Push notifications enabled!' }
  } catch (err) {
    console.log('Error on Push notifications enable', err)
    return {
      sucess: true,
      msg:
        'Error on Push notifications enable, ask Lurin about the problem detail',
    }
  }
}

export function getCurrentSubscription() {
  return registerServiceWorker().then(function (registration) {
    return registration.pushManager.getSubscription()
  })
}

function askPushPermission() {
  return new Promise(function (resolve, reject) {
    var permissionResult = Notification.requestPermission(function (result) {
      resolve(result)
    })
    if (permissionResult) {
      permissionResult.then(resolve, reject)
    }
  })
}

function subscribeUserToPush() {
  return registerServiceWorker()
    .then(function (registration) {
      var subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BM-ZWcNVEPPo8II2W2QCLBccS9jY0_VtKVlRu0vy9jj2vljPgPdQ6tgeVOS9E2OXoJn8Gf5HvySYBX8508rwyBg'
        ),
      }
      return registration.pushManager.subscribe(subscribeOptions)
    })
    .then(function (pushSubscription) {
      console.log(
        'Received PushSubscription: ',
        JSON.stringify(pushSubscription)
      )
      return pushSubscription
    })
}

function registerServiceWorker() {
  return navigator.serviceWorker
    .register('service-worker.js')
    .then(function (registration) {
      console.log('Service worker successfully registered.')
      return registration
    })
    .catch(function (err) {
      console.error('Unable to register service worker.', err)
    })
}

function sendSubscriptionToBackEnd(subscription) {
  subscription.info = 'lurinfacts.ch'

  return makeJsonRequest(registerPushUrl, 'POST', subscription).then(function (
    response
  ) {
    if (!(response.content.data && response.content.data.success)) {
      throw new Error('Bad response from server.', data)
    }
    return response.data
  })
}

function deleteSubscriptionAtBackEnd(subscription) {
  return makeJsonRequest(unregisterPushUrl, 'POST', subscription).then(
    function (response) {
      if (!(response.content.data && response.content.data.success)) {
        throw new Error('Bad response from server.', data)
      }
      return response.data
    }
  )
}

function urlBase64ToUint8Array(base64String) {
  let padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  let base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  let rawData = window.atob(base64)
  let outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
