let Discord = require('discord.io');
let config = require('./config.js');
let lame = require('lame');
let youtubeDL = require('youtube-dl');
let ffmpeg = require('fluent-ffmpeg');
let fs = require('fs');

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
    let ytDL = youtubeDL(url,
      ['-x', '--extract-audio', '--audio-format=mp3']);
    ytDL.on('info', function(info) {
      console.log('Downloading video in mp3 format.');
      // var mp3Stream = ffmpeg(m4aStream)
      //   .noVideo()
      //   .withAudioCodec('libmp3lame')
      //   .format('mp3')
      //   .stream()
      //   .on('start', function(commandLine) {
      //     console.log('Converting m4a to mp3.  Spawned Ffmpeg with command: ' + commandLine);
      //   }); // Mp3 stream
      // let mp3Decoder = new lame.Decoder();
      // mp3Stream.pipe(mp3Decoder);
      // mp3Decoder.on('format', function(format) {
      //   console.log('MP3 decoding started.  Format');
      //   console.log(format);
      //   bot.getAudioContext(
      //     {channel: "219530331357839370", stereo: true}, handleStream);
      // });
      ytDL.pipe(fs.createWriteStream('test.mp3'));
    });
    ytDL.on('end', () => {
      console.log('There will be no more data.');
      bot.getAudioContext(
          {channel: "140673738298359809", stereo: true}, (error, stream) => {
            stream.playAudioFile('test.mp3');
          });
    });
  }
});

//  Handle ctrl + c and shutdown cleanly
process.on('SIGINT', function() {
  console.log('RYAN got interrupt');
  bot.disconnect();
  process.exit();
});
