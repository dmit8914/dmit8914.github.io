
function reverseGeocodeLocation(latlng) {
	var location = {
		x: latlng.lng,
		y: latlng.lat
	};

	var d = $j.Deferred();

	requestAgol({
		url: reverseGeocodeURL,
		data: {
			location: JSON.stringify(location),
			distance: 250
		}
	}).then(
		function (response) {
			var address = response && response.address && response.address.Match_addr;
			var location = response && response.location;
			d.resolve({
				address: address,
				location: location,
				latlng: L.latLng(location.y, location.x)
			});
		},
		function (err) {
			d.reject(err);
		}
	);

	return d;
}

function enrichLocation(location) {
	var d = $j.Deferred();

	requestAgol({
		url: enrichURL,
		data: {
			studyareas: JSON.stringify([{
				geometry: location
			}]),
			returnGeometry: true
		}
	}).then(
		function (response) {
			var featureSet = response &&
				response.results &&
				response.results.length &&
				response.results[0].value &&
				response.results[0].value.FeatureSet &&
				response.results[0].value.FeatureSet.length &&
				response.results[0].value.FeatureSet[0];

			if (!featureSet) {
				d.reject('enrich: no data received')
				return;
			}

			var feature = featureSet &&
				featureSet.features &&
				featureSet.features.length &&
				featureSet.features[0];

			var geojsonFeature = L.esri.Util.arcgisToGeoJSON(feature);

			d.resolve({
				geojsonFeature: geojsonFeature,
				feature: feature
			});
		},
		function (err) {
			d.reject(err);
		}
	);

	return d;
}

function requestAgol(settings) {
	var d = $j.Deferred();

	function onSucess(response) {
		// ArcGIS returns error with HTTP 2xx code, so handle it here
		if (response.error) {
			d.reject(response.error);
		}
		else {
			d.resolve(response);
		}
	}

	function onError(error) {
		d.reject(error);
	}

	var _settings = $j.extend(true, {
		data   : {
			f: "json",
			token: access_token
		},
		success: onSucess,
		error  : onError,
		type   : "GET"
	}, settings);

	if (_settings.data.f === "json" || _settings.data.f === "pjson") {
		_settings.dataType = "json";
	}

	if (_settings.taskPath) {
		_settings.url = _settings.url + _settings.taskPath;
	}

	$j.ajax(_settings);

	return d;
}
