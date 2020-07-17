const pidusage = require('pidusage');
const readline = require('readline');
const { Server } = require('./objects');

let detachMode = "server";

//Our Object Instance of the server
let server = new Server();
//Do we want to output keypress data
let showKeypresses = false;

const keyPresses = {
    'ctrl': {
        'c': [ () => { close(); }, "Closes the program" ],
        'z': [ () => { console.log('Detached from UI'); process.stdin.setRawMode(false); }, "Detaches you from this wrapper to pass input along to other programs ran under this process!" ],
        't': [ () => { test(); }, "Runs my Test Commands" ]
    },
    'normal': {
        'r': [ () => { server.emit('run'); }, "Runs the server" ],
        'q': [ () => { close(); }, "Closes the program" ],
        'b': [ () => { server.emit('build'); }, "Builds the server" ],
        'k': [ () => { showKeypresses = !showKeypresses; console.log(`Keypresses printed to stdin: ${showKeypresses}`); }, "Starts printing keypress information to console" ],
        'h': [ () => { help(); }, "Prints the Help screen" ],
        'f2': [ () => { server.emit('output'); }, "Prints server output" ],
        'f9': [ () => { console.clear(); }, "Clears console" ],
        'f12': [ () => { currentResources(); }, "Prints the current resources to console" ],
        'end': [ () => { console.log(server); }, "Prints Server Variable to console" ],
        'down': [ () => { console.log(server.addons); }, "Prints Config Variable to console" ],
        'pagedown': [ () => { console.log(server.config); }, "Prints Config Variable to console" ],
        'home': [ () => { console.log('Detach mode set to Server'); detachMode = "server"; }, "Sets the Detach mode to Server" ],
        'up': [ () => { console.log('Detach mode set to Addons'); detachMode = "addon"; }, "Sets the Detach mode to Addons" ],

    }
}
startWrapper();

function startWrapper() {
    server.emit('setup');
    //Clear console and setup listener for keypresses
    //console.clear();
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    //On Keypress
    process.stdin.on('keypress', async (key, data) => {

        //Are we processing single keypresses
        if(process.stdin.isRaw) {
            console.clear();

            let type = data.ctrl? 'ctrl' : 'normal';

            if(keyPresses[type].hasOwnProperty(data.name))
                keyPresses[type][data.name][0]();
            else
                console.log('Unknown command');

            if(showKeypresses) {
                console.log(key, data);
            }

            console.log('\r\nPress a key (Use H to see a help list)');
        }
    });

    //On actual data being sent to stdin listener
    process.stdin.on('data', function(data) {
        if(!process.stdin.isRaw) {
            let input = data.toString().trim();

            //Attaches us back to the KeyPress Wrapper
            if(input === "attach") {
                console.clear();
                process.stdin.setRawMode(true);
                console.log("You have reattached to the wrapper successfully");

            //Sends something as input over to the server input
            } else {
                if(detachMode === "server") {
                    serverCommands(input);
                } else if(detachMode === "addon") {
                    addonComands(input);
                }
            }
        }
        
    });

    //Pay respect to Keanu
    console.log("Your breathtaking.");
    console.log('Press a key (Use H to see a help list)');
}

function serverCommands(input) {
    if(input === "close") {
        server.emit('stop');
    } else if (input === "remove") {
        let time = 2;
        console.log(`Deletion will proceed in ${time} seconds. Please close this program by tapping q or ctrl + c to stop deletion from happening.`);
        setTimeout(function(){server.emit('remove')}, time*1000);
    } else {
        server.input(input);
    }
}

function addonComands(input) {
    let args = input.split(" ");

    if(args[0] === "install") {
        server.addons.emit('install', args[1], args[2]);
    } else if(args[0] === "remove") {
        server.config.emit("remove", args[1], args[2]);
    } else if(args[0] === "sync") {
        server.config.addons.emit('resyncAnnex');
    } 
}

function help(){
    let modifiers = ['ctrl', 'normal'];

    console.log('Current commands:');

    for(let i = 0; i < modifiers.length; i++) {
        let keys = Object.keys(keyPresses[modifiers[i]]);

        for(let j = 0; j < keys.length; j++) {
            console.log(`${keys[j]} - ${keyPresses[modifiers[i]][keys[j]][1]}`);
        }
    }
}

async function currentResources(options) {
    let pids = [process.pid];
    if(server.running) {
        pids.push(server.process.pid);
    }

    pidusage(pids, function( err, stats ){

        console.log(`Wrapper Resources:\r\nCPU Usage: ${Math.round(stats[pids[0]].cpu)}%\r\nMem Allocated: ${Math.round(stats[pids[0]].memory/1048576)} MB`);

        if(stats.hasOwnProperty(pids[1])) {
            console.log(`\r\nServer Resources:\r\nCPU Usage: ${Math.round(stats[pids[1]].cpu)}%\r\nMem Allocated: ${Math.round(stats[pids[1]].memory / 1048576)} MB`);
        }
    });
}

function close() {
    if(server.running)
        server.emit('stop');
    
    console.log(`You're still breathtaking.`);
    process.exit();
}

async function test(){
    server.config.emit('write');
}