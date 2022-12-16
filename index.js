const currentCity = document.getElementById("current-city");
const currentIcon = document.getElementById("current-icon");
const currentTemp = document.getElementById("current-temp");
const currentWind = document.getElementById("current-wind");
const currentHum = document.getElementById("current-hum");
const forecastContainer = document.getElementById("forecast-container");
const searchHistoryContainer = document.getElementById(
    "search-history-container"
);
const citySearchForm = document.getElementById("city-search-form");

// Set up URLs from all APIs used
const CURRENT_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_BASE_URL = "https://api.openweathermap.org/data/2.5/forecast";
const GEO_BASE_URL = "https://api.openweathermap.org/geo/1.0/direct";
const API_KEY = "db20d42d3280d7ded6b519ef08fd0069";
const getIconUrl = (code) => `https://openweathermap.org/img/wn/${code}@2x.png`;

// Fetch history from local storage
let searchHistory = JSON.parse(localStorage.getItem("searchHistory"));
if (!searchHistory) searchHistory = [];
renderHistory();

// Add event handler to handle submission of search form
citySearchForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get input from search bar and search the geolocation api for coords
    const inputText = e.target.children[0].value.trim().toLowerCase();
    e.target.children[0].value = ""
    const cityData = await searchCity(inputText);

    // Fetch the weather from that city's coordinates
    const weatherData = await fetchWeather([cityData[0].lat, cityData[0].lon]);

    // Render new weather information to DOM
    updateWeatherDetails(weatherData[0]);
    updateForecast(weatherData);

    // Add search to history and render to DOM
    addToHistory({
        name: cityData[0].name,
        coords: [cityData[0].lat, cityData[0].lon]
    });
    renderHistory();
});

// Event listener with event delegation for searching using history
searchHistoryContainer.addEventListener("click", async e => {
    if (!e.target.classList.contains("history-button")) return

    const cityData = await searchCity(e.target.innerText);

    // Fetch the weather from that city's coordinates
    const weatherData = await fetchWeather([cityData[0].lat, cityData[0].lon]);

    // Render new weather information to DOM
    updateWeatherDetails(weatherData[0]);
    updateForecast(weatherData);
})

// Use OpenWeather's geolocation API to get coordinates of a city
const searchCity = async (query) => {
    const res = await fetch(
        GEO_BASE_URL + `?q=${query}&limit=5&appid=${API_KEY}`
    );
    const data = await res.json();
    return data;
};

// Use OpenWeather's 5 day forecast and current weather APIs to get weather data
const fetchWeather = async (coordinates) => {
    // Array to hold all weather data for the current and forecast
    const weatherData = [];
    const urlQuery = `?lat=${coordinates[0]}&lon=${coordinates[1]}&units=imperial&appid=${API_KEY}`;

    // Get current weather data
    let res = await fetch(CURRENT_BASE_URL + urlQuery);
    let data = await res.json();
    weatherData.push(data);

    // Get forecast weather data
    res = await fetch(FORECAST_BASE_URL + urlQuery);
    data = await res.json();
    for (let i = 0; i < 5; i++) {
        weatherData.push(data.list.slice(i * 8, i * 8 + 8));
    }
    return weatherData;
};

// Update current weather section
const updateWeatherDetails = (data) => {
    currentCity.innerText = data.name;
    currentIcon.setAttribute("src", getIconUrl(data.weather[0].icon));
    currentIcon.setAttribute("hidden", false);
    currentTemp.innerText = `${Math.round(data.main.temp)}°F`;
    currentWind.innerText = `${Math.round(data.wind.speed)} MPH`;
    currentHum.innerText = `${Math.round(data.main.humidity)}%`;
};

// Reset and create elements for the forecast section
const updateForecast = (data) => {
    while (forecastContainer.firstChild) {
        forecastContainer.firstChild.remove();
    }
    for (let i = 1; i < data.length; i++) {
        const template = document.createElement("template");
        template.innerHTML =
            "<div><img></img><h2></h2><div><p>Temperature <span></span></p><p>Wind Speeds <span></span></p><p>Humidity <span></span></p></div></div>";
        const forecastItemDiv = template.content.childNodes[0];
        forecastItemDiv.classList.add("forecast-item");

        forecastItemDiv.childNodes[0].setAttribute(
            "src",
            getIconUrl(data[i][3].weather[0].icon)
        );
        forecastItemDiv.childNodes[1].innerHTML = data[i][3].dt_txt.slice(0,10);
        forecastItemDiv.childNodes[2].childNodes[0].childNodes[1].innerText = `${Math.round(
            data[i][3].main.temp
        )}°F`;
        forecastItemDiv.childNodes[2].childNodes[1].childNodes[1].innerText = `${Math.round(
            data[i][3].wind.speed
        )} MPH`;
        forecastItemDiv.childNodes[2].childNodes[2].childNodes[1].innerText = `${Math.round(
            data[i][3].main.humidity
        )}%`;

        forecastContainer.appendChild(forecastItemDiv);
    }
};

// Add a recent search to the local storage
const addToHistory = (search) => {
    if (searchHistory.length >= 6) {
        searchHistory.shift()
    }
    searchHistory.push(search);
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
};

// Render history buttons to DOM
function renderHistory() {
    console.log(searchHistory);
    if (searchHistory.length < 1) return
    while (searchHistoryContainer.firstChild) {
        searchHistoryContainer.firstChild.remove()
    }
    searchHistory.forEach((search) => {
        const historyButton = document.createElement("button");
        historyButton.classList.add("history-button");
        historyButton.innerText = search.name;
        searchHistoryContainer.appendChild(historyButton)
    });
}
