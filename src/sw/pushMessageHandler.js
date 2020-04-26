export function preparePushMessage(event) {
  if (event.data) {
    console.log("This push event has data: ", event.data.text());
  } else {
    console.log("This push event has no data.");
  }

  var pushMsg = convertMessage(event.data);
  if (pushMsg.type) {
    var options = prepareOptions(pushMsg);
    return { title: pushMsg.title, options };
  } else {
    console.log("This push event has no pushType.");
  }
}

function convertMessage(data) {
  try {
    return data.json();
  } catch (err) {
    console.log("could not jsonize " + data.text(), err);
  }
  //return test message!
  return {
    type: "message",
    title: "Lurin just like to say that he is watching you!",
    message: "",
    timestamp: new Date(),
  };
}

function prepareOptions(pushMsg) {
  console.log("handle push msg:" + pushMsg.type);
  var data = { url: "/home" };

  if (pushMsg.type == "newfact" || pushMsg.type == "randomfact") {
    data = { url: "/facts?key=" + pushMsg.itemKey };
  }
  if (pushMsg.type == "newimage" || pushMsg.type == "randomimage") {
    data = { url: "/slideShow?key=" + pushMsg.itemKey };
  }

  const options = {
    badge: "/images/logo192m.png",
    icon: "/images/logo192m.png",
    body: pushMsg.message,
    data: data,
    vibrate: [500, 110, 500],
    timestamp: pushMsg.timestamp,
  };

  return options;
}
