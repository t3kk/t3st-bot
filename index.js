let Discord = require('discord.io');
let config = require('./config.js');
let lame = require('lame');
let youtubeDL = require('youtube-dl');
let ffmpeg = require('fluent-ffmpeg');
let fs = require('fs');
let Volume = require('pcm-volume');

// Define some stuff!!!
// TODO move this out to some singletons for easier access?
let volumeStream = new Volume();
volumeStream.setVolume(.05);
let volumeRegex = /^@(?:vol|volume) ([0-9]{1,2})/;

let bot = new Discord.Client({
  token: config.token,
  autorun: true
});

bot.on('ready', function() {
  console.log(bot.username + " - (" + bot.id + ")");
  bot.joinVoiceChannel("140673738298359809");
});

bot.on('message', function(user, userID, channelID, message, event) {
  //  If the message starts with roll, take the first instance of the dice regex and give the result
  //  TODO: error checking
  if (message.startsWith('!roll ')) {
    //  TODO: use matching group so we can switch on the command part
    let diceRegex = /!roll (\d*)(d)(\d+)( for .*)?/;
    let requestedRole = diceRegex.exec(message);
    //  If the numebr of rolls wasn't defined, set it to 1
    let numberOfRolls = requestedRole[1] ? requestedRole[1] : 1;
    let dieType = requestedRole[3];
    //  If there is no reason supplied make the explanation for the roll blank.
    let reason = requestedRole[4] ? requestedRole[4] : '';
    let sum = 0;
    let rolls = [];
    for (let i = 0; i < numberOfRolls; i++) {
      let roll = Math.ceil(Math.random() * dieType);
      rolls.push(roll);
      sum += roll;
    }
    let response = `@${user} rolled ${numberOfRolls} d${dieType} ` +
      `for a total of ${sum}${reason}.  Rolls were ${rolls}.`;
    bot.sendMessage({
      to: channelID,
      message: response
    });
  }
  if (message.startsWith('@play ')) {
    // TODO: vlaidate URL with https://gist.github.com/dperini/729294 ?
    // get the url
    let url = message.substr(6);
    console.log(`url: ${url}`);
    youtubeDL.exec(url,
      ['-x', '--audio-format', 'mp3', '--audio-quality', '128K'],
      {},
      function exec(err, output) {
        'use strict';
        if (err) {
          throw err;
        } else {
          // Play file
          console.log(output.join('\n'));
          queueFile(output);
        }
      // output.pipe(fs.createWriteStream('test.mp3'));
      }
    );
  }
  if (volumeRegex.exec(message)) {
    let newVolume = volumeRegex.exec(message)[1] / 100;
    console.log(`setting volume to ${newVolume}`);
    volumeStream.setVolume(newVolume);
  }
});

//  Handle ctrl + c and shutdown cleanly
process.on('SIGINT', function() {
  console.log('RYAN got interrupt');
  bot.disconnect();
  process.exit();
});

// TODO Rename to somethign involving getting the file name and move out
function queueFile(output){
  let ChildProc = require('child_process');
  // Kinda trustingly get file name... Make this seletcion safer if possible
  let fileNameRegex = /^\[ffmpeg\] Destination: (.*)/;
  let fileNameExtraction = fileNameRegex.exec(output[output.length - 2]);
  console.log(fileNameExtraction);
  if (fileNameExtraction) {
    let fileName = fileNameExtraction[1];
    console.log(`Queue File ${fileName}`);
    bot.getAudioContext(
        {channel: "140673738298359809", stereo: true}, (error, stream) => {
          //TODO:hook queue into callbacks https://github.com/izy521/discord.io/blob/daeba2c4aa292657cc7b490e73c563991bd3980b/lib/index.js#L1957
          let pcmStream = ChildProc.spawn('ffmpeg', [
            '-i', fileName,
            '-f', 's16le',
            '-ar', '48000',
            'pipe:1'
          ], {stdio: ['pipe', 'pipe', 'ignore']});
          // let speaker = new Speaker();
          // volumeStream.pipe(speaker);
          pcmStream.stdout.pipe(volumeStream);
          console.log(pcmStream);
          stream.send(volumeStream);
          // stream.send(pcmVolStream);
        });
  } else { // Unable to extract file name
    console.log('File Not Found!  YTDL Output:');
    console.log(output);
  }
}
