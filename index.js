let Discord = require('discord.io');
let config = require('./config.js');
let lame = require('lame');
let youtubeDL = require('youtube-dl');
let ffmpeg = require('fluent-ffmpeg');

let bot = new Discord.Client({
  token: config.token,
  autorun: true
});

bot.on('ready', function() {
  console.log(bot.username + " - (" + bot.id + ")");
  bot.joinVoiceChannel("149328947560054784");
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
    let videoStream = youtubeDL('https://www.youtube.com/watch?v=quwBEzrwXSU',
      ['--format=m4a']);
    videoStream.on('info', function(info) {
      console.log(info);
      var command = ffmpeg(videoStream).noVideo().withAudioCodec('f64le');
      let handleStream = function handleStream(error, stream) {
        console.log('url? ' + url);
        stream.send(command);
      };
      bot.getAudioContext(
        {channel: "149328947560054784", stereo: true}, handleStream);
    });
  }
});

function playMP3(stream) {

  stream.send(send);
}

//  Handle ctrl + c and shutdown cleanly
process.on('SIGINT', function() {
  console.log('RYAN got interrupt');
  bot.disconnect();
  process.exit();
});
