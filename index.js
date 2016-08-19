let Discord = require('discord.io');
let config = require('./config.js');

let bot = new Discord.Client({
  token: config.token,
  autorun: true
});

bot.on('ready', function() {
  console.log(bot.username + " - (" + bot.id + ")");
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
});

//  Handle ctrl + c and shutdown cleanly
process.on('SIGINT', function() {
  console.log('RYAN got interrupt');
  bot.disconnect();
  process.exit();
});
