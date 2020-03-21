export function getDisplayTime(insertTime) {
  var diff = new Date().getTime() - insertTime;
  var days = Math.floor(diff / (1000 * 60 * 60 * 24));
  var hours = Math.floor(diff / (1000 * 60 * 60));
  var formatter = new Intl.RelativeTimeFormat(navigator.language, {
    style: "narrow"
  });
  if (days < 3) {
    return formatter.format(-hours, "hours");
  } else if (days < 30) {
    return formatter.format(-days, "days");
  } else {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    };
    return new Date(insertTime).toLocaleDateString("de-DE", options);
  }
}
