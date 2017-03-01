let Discord = require('discord.io');
let config = require('./config.js');
let youtubeDL = require('youtube-dl');

let {addToQueue, setStreamChannel, setVolume, toggleShuffle}
  = require('./src/musicControls');

let voiceChannel = '140673738298359809';
let textChannel = '286204341809840129';

// Define some stuff!!!
// TODO move this out to some singletons for easier access?
let volumeRegex = /^@(?:vol|volume) (100|[0-9]{1,2})/;

let bot = new Discord.Client({
  token: config.token,
  autorun: true,
});

bot.on('ready', function() {
  console.log(bot.username + ' - (' + bot.id + ')');
  bot.joinVoiceChannel(voiceChannel, function(error) {
    if (error) return console.error(error);
    bot.getAudioContext(voiceChannel, function(err, stream) {
      if (err) return console.error(err);
    });
  });
});

bot.on('message', function(user, userID, channelID, message, event) {
  // If the message starts with roll,
  // take the first instance of the dice regex and give the result
  //  TODO: error checking
  if (message.startsWith('@roll ')) {
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
      message: response,
    });
  }
  if (message.startsWith('@play ')) {
    // TODO: vlaidate URL with https://gist.github.com/dperini/729294 ?
    // TODO: use --flat-playlist to get a list of videos and parse one at a time to get a playlist loaded quickly
    // get the url
    let url = message.substr(6);
    bot.simulateTyping(channelID);
    // if only we coudl get lines as they come out.
    // youtubeDL.exec(url,
    //   ['-x', '--audio-format', 'mp3', '--audio-quality', '128K'],
    //   {},
    //   function exec(err, output) {
    //     'use strict';
    //     if (err) {
    //       throw err;
    //     } else {
    //       // Play file
    //       console.log(output.join('\n'));
    //       queueFile(output, event);
    //     }
    //   // output.pipe(fs.createWriteStream('test.mp3'));
    //   }
    // );
    youtubeDL.exec(url,
      ['-sqJ'],
      {},
      function exec(err, output) {
        'use strict';
        if (err) {
          throw err;
        } else {
          // Parse output
          let playlist = JSON.parse(output);
          playlist.entries.forEach(function(entry) {
            console.log(`\n\n${entry.webpage_url}\n${entry.title}`);
          });
        }
      // output.pipe(fs.createWriteStream('test.mp3'));
      }
    );
  }
  if (volumeRegex.exec(message)) {
    let newVolume = volumeRegex.exec(message)[1];
    console.log(`1:) setting volume to ${newVolume}`);
    setVolume(newVolume);
  }

  // TODO: check that the stream is initialized and if not do it.
  if (message.startsWith('@shuffle')) {
    toggleShuffle();
  }
});

//  Handle ctrl + c and shutdown cleanly
process.on('SIGINT', function() {
  console.log('RYAN got interrupt');
  bot.disconnect();
  process.exit();
});


/**
 * Takes a file and a message event.  Removes the message from the channel that
 * the message was on and queues the file up for playback.
 * @param {string} output
 * @param {object} messageEvent
 */
function queueFile(output, messageEvent) {
  // TODO Rename to somethign involving getting the file name and move out
  // Kinda trustingly get file name... Make this seletcion safer if possible
  let fileNameRegex = /^\[ffmpeg\] Destination: (.*)/;
  // let outputFilesRegex = /\[ffmpeg\] Destination: (.*?\..*?)'/;  //Smash the output together and then globally match this regex?
  output.filter( function(row) {  // Run a filter maybe?
    let fileNameExtraction = fileNameRegex.exec(row);
    console.log(fileNameExtraction);
    if (fileNameExtraction) {
      let fileName = fileNameExtraction[1];
      console.log(`Queue File ${fileName}`);
      setupStream();
      addToQueue(fileName, getMentionStringForSender(messageEvent));
    }
  });
  removeMessageByEvent(messageEvent);
}

/**
 * Removes a message from the channel it was posted by using data contained in the message event itself.
 * @param {object} messageEvent
 */
function removeMessageByEvent(messageEvent) {
  let messageId = messageEvent.d.id;
  let channelId = messageEvent.d.channel_id;
  bot.deleteMessage(channelId, messageId);
}
/**
 * @param {object} messageEvent
 * @return {string} that can be used to mention the sender of the message related to the messageEvent
 */
function getMentionStringForSender(messageEvent) {
  return `<@${messageEvent.d.author.id}>`;
}

let streamSetup;
/**
 * Initializes variables in src/musicControls.js...  Probably refactor this.
 */
function setupStream() {
  if (!streamSetup) {
    streamSetup = true;
    setStreamChannel(bot, voiceChannel, textChannel);
  }
}
