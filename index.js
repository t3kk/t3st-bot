let Discord = require('discord.io');
let config = require('./config.js');
let youtubeDL = require('youtube-dl');

let {addToQueue, setStreamChannel, setVolume, toggleShuffle}
  = require('./src/musicControls');
let {download} = require('./src/downloadQueue');

let voiceChannel = '314260605177692163'; //  Novron
let textChannel = '286204341809840129'; // Novron
// let voiceChannel = '219530331357839370'; // audio test
// let voiceChannel = '236302765612204042'; // The Apple
// let textChannel = '236302765180059659'; // The Apple

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

// Handle Disconnects
bot.on('disconnect', function() {
  console.log('encountered disconnect');
  bot.connect();
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
    // TODO: split into its own function
    // get the url
    let url = message.substr(6);
    bot.simulateTyping(channelID);
    let time = new Date().getTime();

    youtubeDL.getInfo(url, [],
      {maxBuffer: Infinity},
      function exec(err, info) {
        if (err) {
          throw err;
        } else {
          console.log(`parser time: ${(new Date().getTime()) - time}`);
          // Check if its a playlist
          if (Array.isArray(info)) {
            info.forEach( (entry) => {
              downloadFile(entry, event);
            });
          } else {  // it is a single song
            downloadFile(info, event);
          }
        }
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

function downloadFile(entry, event) {
  // Send each URL to the download queue
  console.log(`\n\n${entry.webpage_url}\n${entry.title}`);
  download(entry.webpage_url, function(success, fileName) {
    if (success) {
      setupStream();
      addToQueue(fileName, getMentionStringForSender(event));
    } else {
      // TODO send message to channel or requester about failure
      console.log(`Failed to download ${entry.title}[${entry.webpage_url}]`);
    }
  });
}


/**
 * Takes a file and a message event.  Removes the message from the channel that
 * the message was on and queues the file up for playback.
 * @param {string} output
 * @param {object} messageEvent
 */
function queueFile(output, messageEvent) {
  // TODO Rename to somethign involving getting the file name and move out
  // Kinda trustingly get file name... Make this seletcion safer if possible



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
