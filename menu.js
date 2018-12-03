const webshot = require('webshot');
const request = require('request');
const cheerio = require('cheerio');
const discord = require("discord.js");
const schedule = require('node-schedule');

// https://discordapp.com/oauth2/authorize?client_id=518800876966772766&scope=bot&permissions=0

const client = new discord.Client();
const config = require("./config.json");

function send_boccalino_menu(channel) {
    channel.send('Menu pizza du Boccalino: https://wormsparty.github.io/boccali-carte');
}

function send_sanmarco_menu(channel) {
    const sanmarco_options = {
        screenSize: {
            width: 905,
            height: 855
        }, shotSize: {
            width: 309,
            height: 420
        }, shotOffset: {
            left: 7.5,
            top: 354,
        },
        userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g',
    };

    webshot('piazza-san-marco.ch', 'san-marco.jpeg', sanmarco_options, function() {
        channel.send('Menu du San Marco:', {
            file: './san-marco.jpeg'
        });
    });
}

function send_hep_menu(channel) {
    const hep_options = {
        screenSize: {
            width: 991,
            height: 1080
        }, shotSize: {
            width: 515,
            height: 247
        }, shotOffset: {
            left: 236,
            top: 715,
        },
        userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g',
    };

    webshot('hepl.ch/cms/accueil/acces-rapide/pratique/restaurant.html', 'hep.jpeg', hep_options, function() {
        channel.send('Menu de la HEP:', {
            file: './hep.jpeg'
        });
    });
}

function send_pinocchio_menu(channel) {
    request('http://www.le-pinocchio.ch', function(err, resp, body) {
        const $ = cheerio.load(body);
        const links = $('a');
        let highestWeekNo = 0;
        let currentUrl = '';

        $(links).each(function(i, link){
            const url = $(link).attr('href').toLowerCase();

            if (url.startsWith('/view/data/3070/') && url.indexOf('semaine') > -1) {
                url.replace(/%20(\d+).pdf$/, function(match, wn) {
                    // This is to make sure that when we switch to a new year, it prefers "semaine 1" to "semaine 52" if both exist
                    if (wn < 10) {
                        wn += 52;
                    }

                    if (wn > highestWeekNo) {
                        highestWeekNo = wn;
                        currentUrl = $(link).attr('href')
                    }
                });
            }
        });

        channel.send('Menu du Pinocchio: http://www.le-pinocchio.ch' + currentUrl);
    });
}

function send_menu() {
    let channel = client.channels.get(config.channel);

    send_boccalino_menu(channel);
    send_hep_menu(channel);
    send_sanmarco_menu(channel);
    send_pinocchio_menu(channel);
}

client.on("message", async message => {
    if(message.author.bot) {
        return;
    }

    if(message.content.indexOf(config.prefix) !== 0) {
        return;
    }

    if (message.channel.id !== config.channel) {
        return;
    }

    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'menu') {
        send_menu();
    }
});

client.on("ready", () => {
    schedule.scheduleJob('0 0 11 * * 1-5', function () {
        send_menu();
    });

    console.log('Ready!');
});

client.login(config.token);