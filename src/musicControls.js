let ChildProc = require('child_process');
let Volume = require('pcm-volume');

let songNameRegex = /(.*)-.*\.mp3$/;
// TODO:allow  queue to be by channel
let playQueue = [];
let playHistory = [];
// Load from config
let shuffle = false;
let isPlaying = false;
let volume = 0.15;
let voiceStream;

let musicStream;

let textChannelId;
let bot;
let voiceChannelId;

//TODO: check for 48000Hz
function addToQueue(fileName) {
  console.log(`addToQueue`);
  let song = {
    fileName: fileName,
    songName: songNameRegex.exec(fileName)[1]
  };
  playQueue.push(song);
  _playNext();
}

function _playNext() {
  console.log(`playNext enter? ${!isPlaying && playQueue.length > 0}`);
  if (!isPlaying && playQueue.length > 0) {
    bot.getAudioContext(
      {channel: voiceChannelId, stereo: true}, (error, stream) => {
        voiceStream = stream;
        console.log(`err: ${error}`);
        // TODO:hook queue into callbacks https://github.com/izy521/discord.io/blob/daeba2c4aa292657cc7b490e73c563991bd3980b/lib/index.js#L1957
        isPlaying = true;
        musicStream = new Volume();
        musicStream.setVolume(volume);
        voiceStream.send(musicStream);
        let song = playQueue.shift();
        playHistory.push(song);
        let pcmStream = ChildProc.spawn('ffmpeg', [
          '-i', song.fileName,
          '-f', 's16le',
          '-ar', '48000',
          'pipe:1'
        ], {stdio: ['pipe', 'pipe', 'ignore']});
        // let speaker = new Speaker();
        // volumeStream.pipe(speaker);
        // TODO Let the stream close out and then get audio context agian?
        pcmStream.stdout.pipe(musicStream);
        pcmStream.on('close', _handleSongEnd);
      }
    );
  }
}

function _handleSongEnd() {
  // Reset the streams
  // TODO: Return a function so we don't grow the stack here
  console.log(`handle song end`);
  isPlaying = false;
  _playNext();
}

function setVolume(percentage){
  console.log(`setting volume to ${percentage / 100}`);
  musicStream.setVolume(percentage / 100);
  volume = percentage / 100;
}

// TODO ensure stream is set before playback
function setStreamChannel(newBot, newVoiceChannelID, newTextChannelId) {
  console.log('this bot');
  console.log(bot);
  bot = newBot;
  voiceChannelId = newVoiceChannelID;
  textChannelId = newTextChannelId;
}

module.exports = {addToQueue, setStreamChannel, setVolume};
