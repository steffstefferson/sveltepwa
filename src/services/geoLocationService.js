var key = 'AIzaSyC0P3kNpRrvnXLbNXLx4D033Fz0ttPsgkI';
var baseUrl = 'https://maps.google.com/maps/api/geocode/json?&key=' + key;

export async function getPositionByCoords(lat, lng) {
    var geoUrl = baseUrl + '&latlng=' + lat + ',' + lng;
    return geoCodeService(geoUrl);
}

export async function getPositionByAddress(address) {
    var geoUrl = baseUrl + '&address=' + address;
    return geoCodeService(geoUrl);
}

async function geoCodeService(geoUrl) {
    let data = await makeRequest(geoUrl);
    let json = JSON.parse(data.responseText);

    console.log(json);
    if (json.results.length > 0) {
        var res0 = json.results[0];
        var location = {
            latitude: res0.geometry.location.lat,
            longitude: res0.geometry.location.lng,
            address: res0.formatted_address,
            country: res0.address_components[res0.address_components.length - 2].long_name,
        };
        return location;
    }
    return null;
}

var makeRequest = function (url, method) {
    var request = new XMLHttpRequest();
    return new Promise(function (resolve, reject) {
        request.onreadystatechange = function () {
            if (request.readyState !== 4) return;
            if (request.status >= 200 && request.status < 300) {
                resolve(request);
            } else {
                reject({
                    status: request.status,
                    statusText: request.statusText,
                });
            }
        };
        request.open(method || 'GET', url, true);
        request.send();
    });
};
