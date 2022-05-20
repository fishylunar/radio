/*!
 *  Howler.js Audio Player Demo
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */
// Get stations
var __stations = []
var getJSON = function(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'json';
  xhr.onload = function() {
    var status = xhr.status;
    if (status === 200) {
      callback(null, xhr.response);
    } else {
      callback(status, xhr.response);
    }
  };
  xhr.send();
};
if( typeof Element.prototype.clearChildren === 'undefined' ) {
  Object.defineProperty(Element.prototype, 'clearChildren', {
    configurable: true,
    enumerable: false,
    value: function() {
      while(this.firstChild) this.removeChild(this.lastChild);
    }
  });
}
getJSON('stations.json',
function(err, data) {
  if (err !== null) {
console.err(err)
  } else {
    console.log(data)
   __stations = data
   player = ""
   list.clearChildren();
   player = new Player(__stations)
  }
});

// Cache references to DOM elements.
var elms = ['track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'playlistBtn', 'volumeBtn', 'progress', 'bar', 'wave', 'loading', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
var Player = function(playlist) {
  this.playlist = playlist;
  this.index = 0;

  // Display the title of the first track.
  track.innerHTML = '1. ' + playlist[0].title;
  timer.innerHTML = `<img width=32px src=${this.playlist[this.index].imageUri}>`
  // Setup the playlist display.
  playlist.forEach(function(song) {
    var div = document.createElement('div');
    div.className = 'list-song';
    div.innerHTML = song.title;
    div.onclick = function() {
      player.skipTo(playlist.indexOf(song));
    };
    list.appendChild(div);
  });
};
Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function(index) {
    
    var self = this;
    timer.innerHTML = `<img width=32px src=${this.playlist[this.index].imageUri}>`
    var sound;

    index = typeof index === 'number' ? index : self.index;
    var data = self.playlist[index];

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
      timer.innerHTML = `<img width=32px src=${this.playlist[this.index].imageUri}>`
    } else {
      sound = data.howl = new Howl({
        html5: true, // A live stream can only be played through HTML5 Audio.
        src:data.file,
        format: ['mp3', 'aac'],
        onplay: function() {
          // Display the duration.
          duration.innerHTML = "Live"
          setMeta(data)
          timer.innerHTML = `<img width=32px src=${data.imageUri}>`
          // Set title text
          document.title = "SusRadio - " + data.title + " [LIVE]"
          //self.formatTime(Math.round(sound.duration()));

          // Start updating the progress of the track.
          requestAnimationFrame(self.step.bind(self));

          // Start the wave animation if we have already loaded
          wave.container.style.display = 'block';
          bar.style.display = 'none';
          pauseBtn.style.display = 'block';
        },
        onload: function() {
          // Start the wave animation.
          wave.container.style.display = 'block';
          bar.style.display = 'none';
          loading.style.display = 'none';
        },
        onend: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
          self.skip('next');
        },
        onpause: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
        },
        onstop: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
        },
        onseek: function() {
          // Start updating the progress of the track.
          requestAnimationFrame(self.step.bind(self));
        }
      });
    }

    // Begin playing the sound.
    sound.play();
    timer.innerHTML = `<img width=32px src=${self.playlist[self.index].imageUri}>`
    // Update the track display.
    track.innerHTML = (index + 1) + '. ' + data.title;

    // Show the pause button.
    if (sound.state() === 'loaded') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    } else {
      loading.style.display = 'block';
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
    }

    // Keep track of the index we are currently playing.
    self.index = index;
  },

  /**
   * Pause the currently playing track.
   */
  pause: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;
    timer.innerHTML = `<img width=32px src=${self.playlist[self.index].imageUri}>`
    // Puase the sound.
    sound.pause();
    if (sound) {
      sound.unload();
    }
    // Show the play button.
    playBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function(direction) {
    var self = this;
    timer.innerHTML = `<img width=32px src=${self.playlist[self.index].imageUri}>`
    // Get the next track based on the direction of the track.
    var index = 0;
    if (direction === 'prev') {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function(index) {
    var self = this;
    timer.innerHTML = `<img width=32px src=${self.playlist[self.index].imageUri}>`
    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Reset progress.
    progress.style.width = '0%';

    // Play the new track.
    self.play(index);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function(val) {
    var self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    var barWidth = (val * 90) / 100;
    barFull.style.width = (barWidth * 100) + '%';
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function(per) {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Convert the percent into a seek position.
    if (sound.playing()) {
      sound.seek(sound.duration() * per);
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    var seek = sound.seek() || 0;
    //timer.innerHTML = `<img width=32px src=${self.playlist[self.index].imageUri}>`
    // self.formatTime(Math.round(seek));
    progress.style.width = (((seek / sound.duration()) * 100) || 0) + '%';

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }


  },

  /**
   * Toggle the playlist display on/off.
   */
  togglePlaylist: function() {
    var self = this;
    var display = (playlist.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      playlist.style.display = display;
    }, (display === 'block') ? 0 : 500);
    playlist.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function() {
    var self = this;
    var display = (volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
};

// Setup our new audio player class and pass it the playlist.
var player = new Player([
  {
    title: 'P4 Nordjylland',
    file: 'http://live-icy.gslb01.dr.dk/A/A10H.mp3',
    howl: null,
    imageUri: "https://cdn-profiles.tunein.com/s10135/images/logod.png"
  },
  {
    title: "P6 Beat",
    file: "http://live-icy.gslb01.dr.dk/A/A29H.mp3",
    howl: null,
    imageUri: "https://cdn-profiles.tunein.com/s45455/images/logod.png"
  },
  {
    title: 'ANR',
    file: 'http://stream.anr.dk/anr',
    howl: null,
    imageUri: "https://cdn-radiotime-logos.tunein.com/s25765d.png"
  },
  {
    title: 'Radio ABC',
    file: 'https://radioserver.dk/abc',
    howl: null,
    imageUri: "https://cdn-radiotime-logos.tunein.com/s8926d.png"
  },
  {
    title: "DR Nyheder",
    file: "http://live-icy.gss.dr.dk:8000/A/A02H.mp3",
    howl: null,
    imageUri: "https://cdn-radiotime-logos.tunein.com/s104981d.png"
  }
]);

// Bind our player controls.
playBtn.addEventListener('click', function() {
  player.play();
});
pauseBtn.addEventListener('click', function() {
  player.pause();
});
waveform.addEventListener('click', function(event) {
  player.seek(event.clientX / window.innerWidth);
});
playlistBtn.addEventListener('click', function() {
  player.togglePlaylist();
});
playlist.addEventListener('click', function() {
  player.togglePlaylist();
});
volumeBtn.addEventListener('click', function() {
  player.toggleVolume();
});
volume.addEventListener('click', function() {
  player.toggleVolume();
});

// Setup the event listeners to enable dragging of volume slider.
barEmpty.addEventListener('click', function(event) {
  var per = event.layerX / parseFloat(barEmpty.scrollWidth);
  player.volume(per);
});
sliderBtn.addEventListener('mousedown', function() {
  window.sliderDown = true;
});
sliderBtn.addEventListener('touchstart', function() {
  window.sliderDown = true;
});
volume.addEventListener('mouseup', function() {
  window.sliderDown = false;
});
volume.addEventListener('touchend', function() {
  window.sliderDown = false;
});

var move = function(event) {
  if (window.sliderDown) {
    var x = event.clientX || event.touches[0].clientX;
    var startX = window.innerWidth * 0.05;
    var layerX = x - startX;
    var per = Math.min(1, Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)));
    player.volume(per);
  }
};

volume.addEventListener('mousemove', move);
volume.addEventListener('touchmove', move);

// Setup the "waveform" animation.
var wave = new SiriWave({
  container: waveform,
  width: window.innerWidth,
  height: window.innerHeight * 0.3,
  cover: true,
  speed: 0.03,
  amplitude: 0.7,
  frequency: 2
});
wave.start();

// Update the height of the wave animation.
// These are basically some hacks to get SiriWave.js to do what we want.
var resize = function() {
  var height = window.innerHeight * 0.3;
  var width = window.innerWidth;
  wave.height = height;
  wave.height_2 = height / 2;
  wave.MAX = wave.height_2 - 4;
  wave.width = width;
  wave.width_2 = width / 2;
  wave.width_4 = width / 4;
  wave.canvas.height = height;
  wave.canvas.width = width;
  wave.container.style.margin = -(height / 2) + 'px auto';

  // Update the position of the slider.
  var sound = player.playlist[player.index].howl;
  if (sound) {
    var vol = sound.volume();
    var barWidth = (vol * 0.9);
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  }
};
window.addEventListener('resize', resize);
resize();


function setMeta(data) {
  if ('mediaSession' in navigator) {

    navigator.mediaSession.metadata = new MediaMetadata({
      title: data.title,
      artist: 'SusRadio',
      artwork: [
        { src: data.imageUri},
            ]
    });
  }
}