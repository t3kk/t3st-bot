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

let musicStream = new Volume();
musicStream.setVolume(volume);
let chatChannel;

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
    isPlaying = true;
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
    //TODO Let the stream close out and then get audio context agian?
    pcmStream.stdout.pipe(musicStream);
    pcmStream.on('end', () => console.log('end!'));
    pcmStream.on('close', _handleSongEnd);
    pcmStream.on('exit', () => console.log('exit!'));
    pcmStream.on('error', () => console.log('error!!'));
  }
}

function _handleSongEnd() {
  console.log(`handle song end`);
  isPlaying = false;
  _playNext();
}

function setVolume(percentage){
  musicStream.setVolume(percentage / 100);
  volume = percentage / 100;
}

//TODO ensure stream is set before playback
function setStream(discordVoiceStream, textChannel) {
  console.log(`setStream`);
  discordVoiceStream.send(musicStream);
  chatChannel = textChannel;
}

module.exports = {addToQueue, setStream, setVolume};
