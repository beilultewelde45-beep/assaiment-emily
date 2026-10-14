// =====================================================
//  BEILUL'S PIANO - script.js
//  Main idea: the page LISTENS for keydown and keyup
//  events, then reacts by lighting up a key + playing sound.
// =====================================================


// ===== 1. THE NOTES =====
// Each keyboard letter points to a note. (frequency = how high the sound is, in Hz)
const notes = {
  // white keys (the assignment keys)
  a: { name: "C",  solfege: "Do",   frequency: 261.63 },
  s: { name: "D",  solfege: "Re",   frequency: 293.66 },
  d: { name: "E",  solfege: "Mi",   frequency: 329.63 },
  f: { name: "F",  solfege: "Fa",   frequency: 349.23 },
  g: { name: "G",  solfege: "Sol",  frequency: 392.00 },
  h: { name: "A",  solfege: "La",   frequency: 440.00 },
  j: { name: "B",  solfege: "Ti",   frequency: 493.88 },
  k: { name: "C",  solfege: "Do",   frequency: 523.25 },

  // black keys (bonus)
  w: { name: "C#", solfege: "Do#",  frequency: 277.18 },
  e: { name: "D#", solfege: "Re#",  frequency: 311.13 },
  t: { name: "F#", solfege: "Fa#",  frequency: 369.99 },
  y: { name: "G#", solfege: "Sol#", frequency: 415.30 },
  u: { name: "A#", solfege: "La#",  frequency: 466.16 }
};


// ===== 2. THE SOUNDS (for the dropdown) =====
// Each sound uses a different oscillator type and different settings.
const sounds = {
  piano: { type: "triangle", volume: 0.5,  duration: 1.2 },
  soft:  { type: "sine",     volume: 0.5,  duration: 1.5 },
  organ: { type: "square",   volume: 0.15, duration: 0.9 },
  synth: { type: "sawtooth", volume: 0.18, duration: 0.7 }
};

let currentSound = "piano";   // which sound is selected right now


// ===== 3. FINDING ELEMENTS ON THE PAGE (querySelector) =====
const nowPlayingNote = document.querySelector("#now-playing-note");
const soundSelect    = document.querySelector("#sound-select");
const songTitle      = document.querySelector("#song-title");
const songSequence   = document.querySelector("#song-sequence");
const songStatus     = document.querySelector("#song-status");
const playSongButton = document.querySelector("#play-song");
const stopSongButton = document.querySelector("#stop-song");

// querySelectorAll gives us a list of many elements
const allPianoKeys = document.querySelectorAll(".key");
const songButtons  = document.querySelectorAll(".song-btn");


// ===== 4. WEB AUDIO API: PLAYING A NOTE =====
let audioContext = null;   // created the first time we play a sound

function playNote(frequency) {
  // Browsers only allow sound after the user does something (like pressing a key),
  // so we create the AudioContext here, the first time we need it.
  if (audioContext === null) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const settings = sounds[currentSound];
  const now = audioContext.currentTime;

  const oscillator = audioContext.createOscillator();   // makes the tone
  const gain = audioContext.createGain();               // controls the volume

  oscillator.type = settings.type;
  oscillator.frequency.value = frequency;

  // Volume goes up quickly, then fades out slowly (so there is no ugly "click")
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(settings.volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + settings.duration + 0.05);
}

// Shows the last played note, like: Mi (E)
function showNowPlaying(note) {
  nowPlayingNote.textContent = note.solfege + " (" + note.name + ")";
}


// =====================================================
//  5. KEYBOARD EVENT LISTENERS  (the main part!)
// =====================================================

// --- keydown: runs when a key is PRESSED ---
document.addEventListener("keydown", function (e) {

  // If the key is being held down, the browser keeps sending keydown.
  // e.repeat is true for those extra events, so we stop here (no repeated sound).
  if (e.repeat) {
    return;
  }

  // Ignore shortcuts like Ctrl+A or Cmd+T
  if (e.ctrlKey || e.metaKey || e.altKey) {
    return;
  }

  // e.key tells us which key was pressed. toLowerCase() makes "A" and "a" the same.
  const keyName = e.key.toLowerCase();

  // Is this key in our notes list? If not (Q, 1, Space...), do nothing.
  const note = notes[keyName];
  if (note === undefined) {
    return;
  }

  // Find the piano key on the page that has this data-key
  const pianoKey = document.querySelector('[data-key="' + keyName + '"]');

  pianoKey.classList.add("active");   // light up the key
  playNote(note.frequency);           // play the sound
  showNowPlaying(note);               // update NOW PLAYING
  followAlong(keyName);               // check if it is the next note of the song
});

// --- keyup: runs when a key is RELEASED ---
document.addEventListener("keyup", function (e) {

  const keyName = e.key.toLowerCase();

  // Only mapped keys matter
  if (notes[keyName] === undefined) {
    return;
  }

  // Find the same piano key and remove the active style
  const pianoKey = document.querySelector('[data-key="' + keyName + '"]');
  pianoKey.classList.remove("active");
});

// If the user switches to another window while holding a key,
// we never get the keyup, so we clear all active keys.
window.addEventListener("blur", function () {
  allPianoKeys.forEach(function (key) {
    key.classList.remove("active");
  });
});


// =====================================================
//  6. MOUSE / TOUCH SUPPORT (bonus)
// =====================================================

// Small helper functions used by the mouse and by the automatic song player
function pressKey(keyName) {
  const note = notes[keyName];
  const pianoKey = document.querySelector('[data-key="' + keyName + '"]');

  pianoKey.classList.add("active");
  playNote(note.frequency);
  showNowPlaying(note);
  followAlong(keyName);
}

function releaseKey(keyName) {
  const pianoKey = document.querySelector('[data-key="' + keyName + '"]');
  pianoKey.classList.remove("active");
}

// Add listeners to every piano key.
// "pointer" events work for both the mouse and fingers on a phone.
allPianoKeys.forEach(function (pianoKey) {

  pianoKey.addEventListener("pointerdown", function () {
    pressKey(pianoKey.dataset.key);      // dataset.key reads the data-key attribute
  });

  pianoKey.addEventListener("pointerup", function () {
    releaseKey(pianoKey.dataset.key);
  });

  // if the mouse slides off the key while pressed, release it too
  pianoKey.addEventListener("pointerleave", function () {
    releaseKey(pianoKey.dataset.key);
  });

  pianoKey.addEventListener("pointercancel", function () {
    releaseKey(pianoKey.dataset.key);
  });
});


// =====================================================
//  7. SOUND SELECTOR (change event)
// =====================================================
soundSelect.addEventListener("change", function () {
  currentSound = soundSelect.value;
  soundSelect.blur();   // so typing letters doesn't change the dropdown by accident
});


// =====================================================
//  8. SONG MODE
// =====================================================

// Each song is a list of keyboard letters
const songs = {
  twinkle: {
    title: "Twinkle Twinkle Little Star",
    notes: [
      "a","a","g","g","h","h","g",
      "f","f","d","d","s","s","a",
      "g","g","f","f","d","d","s",
      "g","g","f","f","d","d","s",
      "a","a","g","g","h","h","g",
      "f","f","d","d","s","s","a"
    ]
  },
  ode: {
    title: "Ode to Joy",
    notes: [
      "d","d","f","g","g","f","d","s","a","a","s","d","d","s","s",
      "d","d","f","g","g","f","d","s","a","a","s","d","s","a","a"
    ]
  },
  jingle: {
    title: "Jingle Bells",
    notes: [
      "d","d","d","d","d","d","d","g","a","s","d",
      "f","f","f","f","f","d","d","d","d","g","g","f","s","a"
    ]
  }
};

const NOTE_GAP = 450;      // milliseconds between notes when the song plays itself
const NOTE_LENGTH = 300;   // how long each key stays lit during auto-play

let currentSongId = "twinkle";   // which song is selected
let songPosition = 0;            // which note of the song we are on
let isAutoPlaying = false;       // true while "Play Song" is running
let songTimers = [];             // list of timers, so we can cancel them on Stop

// Draws the note boxes for the selected song and the glowing hint on the piano
function updateSongDisplay() {
  const song = songs[currentSongId];

  // 1) note boxes
  songSequence.innerHTML = "";
  song.notes.forEach(function (keyName, index) {
    const chip = document.createElement("div");
    chip.classList.add("chip");
    chip.innerHTML = keyName.toUpperCase() + "<small>" + notes[keyName].solfege + "</small>";

    if (index < songPosition) {
      chip.classList.add("done");
    } else if (index === songPosition) {
      chip.classList.add("current");
    }
    songSequence.appendChild(chip);
  });

  // 2) remove old hint dots, then show a new one on the next key (only when playing by hand)
  allPianoKeys.forEach(function (key) {
    key.classList.remove("next-hint");
  });

  if (isAutoPlaying === false && songPosition < song.notes.length) {
    const nextKeyName = song.notes[songPosition];
    document.querySelector('[data-key="' + nextKeyName + '"]').classList.add("next-hint");
  }
}

// Called every time a note is played. If it is the right next note, move forward.
function followAlong(keyName) {
  if (isAutoPlaying) {
    return;   // the computer is playing, so don't track the user
  }

  const song = songs[currentSongId];
  if (songPosition >= song.notes.length) {
    return;   // song already finished
  }

  if (keyName === song.notes[songPosition]) {
    songPosition = songPosition + 1;

    if (songPosition >= song.notes.length) {
      songStatus.textContent = "You finished the song. Great job! Press Stop / Reset to try again.";
    } else {
      songStatus.textContent = "Note " + (songPosition + 1) + " of " + song.notes.length;
    }
    updateSongDisplay();
  }
}

// Choose a song
function selectSong(songId) {
  stopSong();
  currentSongId = songId;
  songTitle.textContent = songs[songId].title;
  songStatus.textContent = "Follow the glowing dot, or press Play Song.";

  // highlight the chosen song button
  songButtons.forEach(function (button) {
    if (button.dataset.song === songId) {
      button.classList.add("selected");
    } else {
      button.classList.remove("selected");
    }
  });

  updateSongDisplay();
}

// Play the song automatically
function playSong() {
  stopSong();                 // clear anything that was running
  isAutoPlaying = true;
  songStatus.textContent = "Playing... listen and watch the keys.";

  const song = songs[currentSongId];

  song.notes.forEach(function (keyName, index) {
    // timer 1: press the key
    const pressTimer = setTimeout(function () {
      songPosition = index;
      updateSongDisplay();
      pressKey(keyName);
    }, index * NOTE_GAP);

    // timer 2: release the key a bit later
    const releaseTimer = setTimeout(function () {
      releaseKey(keyName);
    }, index * NOTE_GAP + NOTE_LENGTH);

    songTimers.push(pressTimer, releaseTimer);
  });

  // timer 3: song is finished
  const endTimer = setTimeout(function () {
    isAutoPlaying = false;
    songPosition = 0;
    songStatus.textContent = "Finished! Now try playing it yourself.";
    updateSongDisplay();
  }, song.notes.length * NOTE_GAP);

  songTimers.push(endTimer);
}

// Stop the song and reset everything
function stopSong() {
  songTimers.forEach(function (timer) {
    clearTimeout(timer);
  });
  songTimers = [];

  isAutoPlaying = false;
  songPosition = 0;

  // turn off any lit keys
  allPianoKeys.forEach(function (key) {
    key.classList.remove("active");
  });

  songStatus.textContent = "Stopped. Follow the glowing dot, or press Play Song.";
  updateSongDisplay();
}

// Song button listeners
songButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    selectSong(button.dataset.song);
  });
});

playSongButton.addEventListener("click", playSong);
stopSongButton.addEventListener("click", stopSong);


// ===== 9. START =====
selectSong("twinkle");   // choose the first song when the page loads