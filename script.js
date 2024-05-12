'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map;
let mapEvent;

class App {
  #map;
  #mapEvent;
  workouts = [];

  constructor() {
    this._getPosition();

    inputType.addEventListener('change', this._toggleElevation.bind(this));

    form.addEventListener('submit', this._newWorkout.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not fetch your current location');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coordinates = [latitude, longitude];
    this.#map = L.map('map').setView(coordinates, 13);
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevation() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const { lat, lng } = this.#mapEvent.latlng;

    //get the data
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    const workoutType = inputType.value;
    const coords = [lat, lng];
    let workout;

    //check for the validation
    const isValidInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));

    const isAllPositive = (...inputs) => inputs.every(inp => inp >= 0);

    //if workout running create running object
    if (workoutType === 'running') {
      const cadence = Number(inputCadence.value);
      if (
        !isValidInputs(distance, duration, cadence) ||
        !isAllPositive(distance, duration, cadence)
      )
        return alert('Inputs must be positive numbers!!');

      workout = new Running(coords, distance, duration, cadence);
    }

    // if workout cycling create cycling object
    if (workoutType === 'cycling') {
      const elevationGain = Number(inputElevation.value);
      if (
        !isValidInputs(distance, duration, elevationGain) ||
        !isAllPositive(distance, duration)
      )
        return alert('Inputs must be positive numbers!!');

      workout = new Cycling(coords, distance, duration, elevationGain);
    }

    // add a new workout to the workout array
    this.workouts.push(workout);

    this.workoutMarker(workout);

    //render workout on the map
    console.log(this.workouts);

    form.classList.add('hidden');

    this._clearInputFields();
  }

  _clearInputFields() {
    inputCadence.value = '';
    inputDistance.value = '';
    inputDuration.value = '';
    inputElevation.value = '';
  }

  workoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent('workout.distance')
      .openPopup();
  }
}

class Workouts {
  date = new Date();
  id = Date.now();

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

class Running extends Workouts {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._calcPace();
  }

  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workouts {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._calcSpeed();
  }

  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const app = new App();
