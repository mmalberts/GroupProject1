// ------------------------------------ DATABASE

// initializing firebase
var config = {
    apiKey: "AIzaSyChlr_DL3tTGVq2VXN2E15TnaK6Yh2TzkU",
    authDomain: "project1-480ca.firebaseapp.com",
    databaseURL: "https://project1-480ca.firebaseio.com",
    projectId: "project1-480ca",
    storageBucket: "project1-480ca.appspot.com",
    messagingSenderId: "791645920378"
  };

firebase.initializeApp(config);
var database = firebase.database();

// displays all saved searches as buttons
database.ref().on("value", function(snapshot) {
    // clears contents of savedsearches div to avoid creating duplicate buttons
    $("#savedsearches").empty();

    // pulls saved searches array from database
    savedsearches = snapshot.val().savedsearches;
    cities = snapshot.val().cities;
    countries = snapshot.val().countries;

    for (var i = 1; i < savedsearches.length; i++) {
        // creates a div for each search item
        var div = $("<div class='searchitem'>");

        // creates a button and adds its class and text
        var a = $("<button>").addClass("searchbutton").text(cities[i] + ", " + countries[i]).attr("query", savedsearches[i]);
        
        // creates a close button and adds its class, icon, and index
        var close = $("<img class='closeicon' src='assets/images/close.png'>");
        close.attr("index", i);

        div.append(close).append(a);

        // appends button to list
        $("#savedsearches").append(div);
    }
});

// ------------------------------------ DECLARATIONS, DEFAULTS, AND MISCELLANEOUS

// declare global variables
var usersearch = [];
var city = "";
var country = "";
var currencies = [];
var languages = [];
var latitude = 41.8781;
var longitude = -87.6298;
var search = "Chicago, IL, United States of America";
var savedsearches = [""];
var cities = [""];
var countries = [""];
var dontrun = true;

// initially hide option to save search
$("#save").hide();

// load Chicago's information on start
setTimeout(function() {
    resetThenSearch();
    $(".searchquery1").html("<img id='logo' class='img-responsive' alt='rove' src='assets/images/rove-white.png'>");
}, 1000);

// CORS
jQuery.ajaxPrefilter(function(options) {
    if (options.crossDomain && jQuery.support.cors) {
        options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
    }
});

// creating fixed siderbar
// REFERENCE: https://stackoverflow.com/questions/23081656/fixing-an-element-when-it-reaches-the-top-of-the-page
var stickySidebar = $(".sidebar").offset().top;

$(window).scroll(function() {  
    if ($(window).scrollTop() > stickySidebar) {
        $(".sidebar").addClass("affix");
    }
    else {
        $(".sidebar").removeClass("affix");
    }  
});

// ------------------------------------ ON-CLICK EVENTS (top to bottom)

// grabs user input from search bar
$("#search").on("click", function(event) {
    // grabs user input and trims excess spaces
    search = $("#search-input").val().trim();

    // run search function
    resetThenSearch();

    // show save button
    $("#save").show();
});

// saves search
$("#save").on("click", function(event) {
    // add search to array of saved searches
    savedsearches.push(search);
    cities.push(city);
    countries.push(country);

    // send saved searches to firebase
    database.ref().set({
        savedsearches: savedsearches,
        cities: cities,
        countries: countries
    });
});

// clears saved searches
$("#clear").on("click", function(event) {
    // add search to array of saved searches
    savedsearches = [""];
    cities = [""];
    countries = [""];

    // send saved searches to firebase
    database.ref().set({
        savedsearches: savedsearches,
        cities: cities,
        countries: countries
    });
});

// reexecutes search when saved search button is clicked
$("#savedsearches").on("click", ".searchbutton", function() {
    // setting the search query
    search = $(this).attr("query");

    // run search function
    resetThenSearch();
});


// reexecutes search when saved search button is clicked
$("#savedsearches").on("click", ".closeicon", function() {
    // removing the selected item
    var index = $(this).attr("index");
    savedsearches.splice(index, 1);
    cities.splice(index, 1);
    countries.splice(index, 1);

    // send saved searches to firebase
    database.ref().set({
        savedsearches: savedsearches,
        cities: cities,
        countries: countries
    });    
});

// ------------------------------------ MISCELLANEOUS FUNCTIONS

// resets variables then performs search
function resetThenSearch() {
    // reset variables
    usersearch = [];
    city = "";
    country = "";
    currencies = [];
    languages = [];

    // splitting the string
    usersearch = search.split(", ");
    city = usersearch[0];
    country = usersearch[usersearch.length - 1];

    // displays location on page
    $(".searchquery1").html("<h1>" + city + "</h1>");
    $(".searchquery2").html("<h2>" + city + "</h2>");

    // runs APIs
    googleMapsGeocoding();
    restCountries();
    getNews();
    findEvents();

    if (dontrun == false) {
    	updateImage();
    } else {
    	dontrun = false;
    }
}

// ------------------------------------ API FUNCTIONS

// Algolia Places API
// autocomplete for search bar
// SOURCE: https://community.algolia.com/places/examples.html#disable-styling
(function() {
    var placesAutocomplete = places({
        container: document.querySelector('#input-styling-address input'),
        style: false,
        debug: true
    });
})();

// Dark Sky API
// obtain and display weather information
function darkSky() {
    // remove any previous weather information
    $("#weather").empty();

    var darkSky_key = "54db5805ebfe845b99818a813105725e";
    var darkSky_queryURL = "https://api.darksky.net/forecast/" + darkSky_key + "/" + latitude + "," + longitude;

    $.ajax({
        url: darkSky_queryURL,
        method: "GET"
    }).done(function(response) {
        console.log(response); // for debugging

        for (var i = 0; i < response.daily.data.length; i++) {
            // create a new div for each day of the week
            var div = $("<div class='weatherdiv col-xs-12 col-sm-6 col-md-6 col-lg-3'>");
            var weatherbox = $("<div class='weatherbox'>");
            
            // obtaining weather information
            var summary = response.daily.data[i].summary;
            var temphigh = response.daily.data[i].temperatureHigh;
            var templow = response.daily.data[i].temperatureLow;
            var iconname = response.daily.data[i].icon;
            var icon = $("<img alt='weathericon' class='weathericon'>");

            // selecting icon
            if (iconname == "clear-day") {
                icon.attr("src", "assets/images/clear.png")
            } else if (iconname == "clear-night") {
                icon.attr("src", "assets/images/clear-night.png")
            } else if (iconname == "rain") {
                icon.attr("src", "assets/images/rain.png")
            } else if (iconname == "snow") {
                icon.attr("src", "assets/images/snow.png")
            } else if (iconname == "sleet") {
                icon.attr("src", "assets/images/sleet.png")
            } else if (iconname == "wind") {
                icon.attr("src", "assets/images/wind.png")
            } else if (iconname == "fog") {
                icon.attr("src", "assets/images/fog.png")
            } else if (iconname == "cloudy") {
                icon.attr("src", "assets/images/cloudy.png")
            } else if (iconname == "partly-cloudy-day") {
                icon.attr("src", "assets/images/partly-cloudy-day.png")
            } else if (iconname == "partly-cloudy-night") {
                icon.attr("src", "assets/images/partly-cloudy-night.png")
            } else {
                icon.attr("src", "assets/images/unknown.png")
            }

            // display day heading
            if (i == 0) {
                weatherbox.append("<p><b>TODAY</b></p>");
            } else if (i == 1) {
                weatherbox.append("<p><b>TOMORROW</b></p>");
            } else {
                weatherbox.append("<p><b>" + i + " DAYS LATER</b></p>");
            }

            // display weather information
            weatherbox.append(icon).append("<p>" + summary + "</p>").append("<p><b>High:</b> " + temphigh + "C</p>").append("<p><b>Low:</b> " + templow + "C</p>");
            div.append(weatherbox);
            $("#weather").append(div);    
        }

        // make height of weather divs equal in size
        $(".weatherbox").matchHeight({byRow: false, property: "height"});
    });

    // re-adjust height of weather divs (needed on page load)
    setTimeout(function() {
        $(".weatherbox").matchHeight({byRow: false, property: "height"});
    }, 1000);
}

// Google Maps Geocoding API
// obtain latitude and longitude of location
function googleMapsGeocoding() {
    var googleMapsGeocoding_key = "AIzaSyB7gKl-GUrq-aUv1mD5e0mZfEb8k349JS8";
    var googleMapsGeocoding_queryURL = "https://maps.googleapis.com/maps/api/geocode/json?key=" + googleMapsGeocoding_key + "&address=" + city + "," + country;

    $.ajax({
        url: googleMapsGeocoding_queryURL,
        method: "GET"
    }).done(function(response) {
        console.log(response); // for debugging

        // update coordinates and display map
        latitude = response.results[0].geometry.location.lat;
        longitude = response.results[0].geometry.location.lng;
        googleMapsJavascript();

        // search for nearby places
        googlePlaces();

        // obtain weather information
        darkSky();
    });
}

// Google Maps JavaScript API
// update, style, and display map
// REFERENCE: https://developers.google.com/maps/documentation/javascript/adding-a-google-map
// MAP STYLE BASED ON: https://snazzymaps.com/style/151/ultra-light-with-labels
function googleMapsJavascript() {
    var loc = {lat: latitude, lng: longitude};
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        styles: [
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{"color": "#cce6ff"}, {"lightness": 0}]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [{"color": "#f5f5f5"}, {"lightness": 0}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [{"color": "#ffffff"}, {"lightness": 17}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#ffffff"}, {"lightness": 29}, {"weight": 0.2}]
            },
            {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [{"color": "#ffffff"}, {"lightness": 18}]
            },
            {
                "featureType": "road.local",
                "elementType": "geometry",
                "stylers": [{"color": "#ffffff"}, {"lightness": 16}]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{"color": "#ffb3b3"}, {"lightness": 21}]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [{"color": "#ccffb3"}, {"lightness": 0}]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{"visibility": "on"}, {"color": "#ffffff"}, {"lightness": 16}]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{"saturation": 36}, {"color": "#333333"}, {"lightness": 40}]
            },
            {
                "elementType": "labels.icon",
                "stylers": [{"visibility": "on"}]
            },
            {
                "featureType": "transit",
                "elementType": "geometry",
                "stylers": [{"color": "#f2f2f2"}, {"lightness": 19}]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.fill",
                "stylers": [{"color": "#fefefe"}, {"lightness": 20}]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#fefefe"}, {"lightness": 17}, {"weight": 1.2}]
            }
        ]
    });

    var marker = new google.maps.Marker({
        position: loc,
        map: map,
        icon: "assets/images/location.png"
    });
}

// Google Places API
// search for nearby attractions
function googlePlaces() {
    var googlePlaces_key = "AIzaSyCDcpIf0iLXO9lC6dAQUWAuMyIJNpgFV7w";
    var googlePlaces_queryURL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=" + googlePlaces_key + "&location=" + latitude + "," + longitude + "&radius=8047&rankby=prominence&type=point_of_interest";

    $("#hotels").empty();
    $("#attractions").empty();
    $("#food").empty();

    // attractions
    var googlePlaces_key = "AIzaSyCDcpIf0iLXO9lC6dAQUWAuMyIJNpgFV7w";
    var googlePlaces_queryURL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=" + googlePlaces_key + "&location=" + latitude + "," + longitude + "&radius=8047&rankby=prominence&type=point_of_interest";

    $.ajax({
        url: googlePlaces_queryURL,
        method: "GET"
    }).done(function(response) {
        $("#attractions").text("");
        console.log(response); // for debugging
        for (i = 0; i < 10; i++) {
            var thisPlace = response.results[i];
            var placeDiv = $("<div>");
            var placeName = $("<p>");
            var itemNumber = i + 1;
            placeName.text(itemNumber + ". " + thisPlace.name);
            placeDiv.append(placeName);
            $("#attractions").append(placeDiv);
        }
    });

    // accomodations
    var googlePlaces_queryURL2 = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=" + googlePlaces_key + "&location=" + latitude + "," + longitude + "&radius=8047&rankby=prominence&type=lodging";

    $.ajax({
        url: googlePlaces_queryURL2,
        method: "GET"
    }).done(function(response) {
        console.log(response); // for debugging

        for (var i = 0; i < 10; i++) {
            var div = $("<div>");
            div.addClass("hotelbox");

            var name = response.results[i].name;

            div.append("<p><b>" + (i+1) + ".</b> " + name + "</p>");
            $("#hotels").append(div);    
        }
    });

    //restaurants
    var googlePlaces_key = "AIzaSyCDcpIf0iLXO9lC6dAQUWAuMyIJNpgFV7w";
    var googlePlaces_queryURL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=" + googlePlaces_key + "&location=" + latitude + "," + longitude + "&radius=8047&rankby=prominence&type=restaurant";

    $.ajax({
        url: googlePlaces_queryURL,
        method: "GET"
    }).done(function(response) {
        $("#food").text("");
        console.log(response); // for debugging
        for (i = 0; i < 10; i++) {
            var thisRestaurant = response.results[i];
            var restaurantDiv = $("<div>");
            var restaurantName = $("<p>");
            var itemNumber = i + 1;
            restaurantName.text(itemNumber + ". " + thisRestaurant.name);
            restaurantDiv.append(restaurantName);
            $("#food").append(restaurantDiv);
        }
    });
}

// REST Countries API
// obtain and display language and currency information
function restCountries() {
    var restcountries_queryURL = "https://restcountries.eu/rest/v2/name/" + country;
    var alpha2code;

    $.ajax({
        url: restcountries_queryURL,
        method: "GET"
    }).done(function(response) {
        console.log(response); // for debugging

        // add languages to array
        for (var i = 0; i < response[0].languages.length; i++) {
            languages.push(response[0].languages[i].name);
        }

        // convert language array to string and display it on page
        languages = languages.join(", ");
        $("#language").html(languages);

        // add currencies to array
        for(var i = 0; i < response[0].currencies.length; i++) {
            currencies.push(response[0].currencies[i].name + " (" + response[0].currencies[i].symbol + ", " + response[0].currencies[i].code + ")");
        }

        // convert currency array to string and display it on page
        currencies = currencies.join(", ");
        $("#currency").html(currencies);
        alpha2code = response[0].alpha2Code;

        var tugoApiKey = "pxzuppxje7r2hsu2w3mpnaza";
        var tugoRequestUrl = "https://api.tugo.com/v1/travelsafe/countries/" + alpha2code;
        $("#alerts").empty();

        $.ajax({
            url: tugoRequestUrl,
            method: "GET",
            beforeSend: function(xhr){xhr.setRequestHeader('X-Auth-Api-Key', tugoApiKey);},
        }).done(function(response) {
            // console.log(response);
            var alertsDiv = $("<div>");
            var alertsInfo = $("<h4>");
            var alertsDetails = $("<p>");
            alertsInfo.text(response.advisoryText);
            alertsDetails.text(response.advisories.description);
            alertsDiv.append(alertsInfo);
            alertsDiv.append(alertsDetails);
            $("#alerts").append(alertsDiv);
        });       
    });
}

function getNews() {
    //finding related news articles
    var newsApiKey = "37341660916741f38faa605269e8554f"
    var newsUrl = 'https://newsapi.org/v2/everything?' + 'q=' + city + '&apiKey=' + newsApiKey + "&sources=abc-news,bbc-news,al-jazeera-english,le-monde,nbc-news,the-new-york-times,time,newsweek,daily-mail,associated-press&sortBy=relevancy";
    $("#news").empty();

    $.ajax({
        url:newsUrl,
        method: "GET"
    }).done(function(response) {
        console.log(response); //for debugging
        //creates divs for first 10 articles with relevant info
        for (i = 0; i < 10; i++) {
            var thisArticle = response.articles[i];
            var articleDiv = $("<div>");
            var articleHeader = $("<h4>");
            var articleSource = $("<p>");
            var articleDate = $("<p>");
            var articleUrl = $("<a>");
            articleNumber = i + 1;
            articleSource.text(thisArticle.source.name);
            articleDate.text(moment(thisArticle.publishedAt).format("L"));
            articleUrl.attr("href", thisArticle.url);
            articleUrl.text(articleNumber + ". " + thisArticle.title);
            articleHeader.html(articleUrl);
            articleDiv.append(articleHeader);
            articleDiv.append(articleDate);
            articleDiv.append(articleSource);
            $("#news").append(articleDiv);
        }
    });
};

function findEvents() {
    $("#events").empty();
    //finding events with Eventbrite API
    var eventBriteApiKey = "FPKFWK7MH5W6AEHFNYXN";
    var eventBriteRestUrl = "https://www.eventbriteapi.com/v3/events/search/?token=" + eventBriteApiKey;
    var searchUrl = eventBriteRestUrl + "&location.address=" + city + "&sort_by=date";

    $.ajax({
        url: searchUrl,
        method: "GET"
    }).done(function(response) {
        console.log(response); //for debugging
        //for loop to format important data on first 10 events into divs and print to the events div
        for (i = 0; i < 10; i++) {
            var thisEvent = response.events[i];
            var eventDiv = $("<div>");
            var eventHeader = $("<h4>");
            var eventDates = $("<p>");
            var prettyStart = moment(thisEvent.start.local).format("L LT");
            var prettyEnd = moment(thisEvent.end.local).format("L LT");
            var eventNumber = i + 1;
            eventHeader.html("<a href='" + thisEvent.url + "'>" + eventNumber + ". " + thisEvent.name.text + "</a>");
            eventDates.text(prettyStart + " - " + prettyEnd);
            eventDiv.append(eventHeader);
            eventDiv.append(eventDates);
            $("#events").append(eventDiv);
        }
    })
};

function updateImage() {
    //updating background image with flickr api
    var flickrApiKey = "f555b1104a9e5c75a95381117926837d";
    var flickrUrl = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=" + flickrApiKey + "&text=" + city + "&format=json&nojsoncallback=1&sort=relevance&accuracy=~11&content_type=1&is_getty=true";

    $.ajax({
        url: flickrUrl,
        method: "GET",
    }).done(function(response) {
        // console.log(response);
        var thisPhoto = response.photos.photo[0];
        var photoId = thisPhoto.id;
        var photoServerId = thisPhoto.server;
        var photoFarmId = thisPhoto.farm;
        var photoSecret = thisPhoto.secret;
        var photoUrl = "https://farm" + photoFarmId +".staticflickr.com/" + photoServerId + "/" + photoId + "_" + photoSecret + ".jpg"
        $(".header").css("background-image", "url(" + photoUrl + ")");
    })
}