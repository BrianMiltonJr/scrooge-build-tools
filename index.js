const pidusage = require('pidusage');
const mysql = require('promise-mysql');
const readline = require('readline');
const { Server } = require('./objects');
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'scrooge'
};

//Our Object Instance of the server
let server = null;
//Do we want to output keypress data
let showKeypresses = false;

startWrapper();

function initialize() {
    console.log("Bootstrapping Server");
    server = new Server();
}

async function startWrapper() {
    await initialize();

    //Clear console and setup listener for keypresses
    console.clear();
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', async (key, data) => {

        //Are we processing single keypresses
        if(process.stdin.isRaw) {
            console.clear();
            //Quits the application
            if (data.ctrl && data.name === 'c' || data.name === 'q') {
                console.log(`You're still breathtaking.`);
                process.exit();

            //Builds the Servers
            } else if(data.name === 'b') {
                console.log('Beginning Build Process of Server');
                server.build();

            //Enables Keypress Debug Diagnostic
            } else if(data.name === 'k') { 
                showKeypresses = !showKeypresses;
                console.log(`Keypresses printed to stdin: ${showKeypresses}`);

            //Prints out Server Memory Buffer
            } else if(data.name === 'f2') {
                console.log(server.output());
            
            //Prints current resources
            }else if(data.name === 'f12') {
                currentResources({mem: "GB"});

            //Runs the Server
            } else if(data.name === 'r') {
                server.run();

            //Detaches stdin from running here and breing
            } else if (data.ctrl && data.name === 'z') {
                console.log('Detached from UI');
                process.stdin.setRawMode(false);

            //Clears the console
            } else if(data.name === 'f9') {
                console.clear();

            //Prints help when unrecognized command is used
            } else if(data.name === 'h') {
                let commands = [
                    ['q', 'ctrl + c', 'Closes the application'],
                    ['b', 'Builds the server'],
                    ['r', 'Runs the server'],
                    ['k', 'Prints which key was pressed'],
                    ['ctrl + z', 'Detaches you from this wrapper to pass input along to other programs ran under this process!'],
                    ['F9', 'Clears console']
                ];

                console.log('Current Commands:');
                for(let index = 0; index < commands.length; index++) {
                    let command = commands[index];
                    let description = command[command.length-1];
                    command.pop();

                    console.log(`${command.join(", ")}  -   ${description}`);
                }
            } else {
                console.log('Unknown keypress.');
            }

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
            } else if(input === "close") {
                server.stop();
            } else if (input === "remove") {
                let time = 2;
                console.log(`Deletion will proceed in ${time} seconds. Please close this program by tapping q or ctrl + c to stop deletion from happening.`);
                setTimeout(function(){server.remove()}, time*1000);
            }else {
                server.input(input);
            }
        }
        
    });

    //Pay respect to Keanu
    console.log("Your breathtaking.");
    console.log('Press a key (Use H to see a help list)');
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

async function queryDb(query) {
    let connection;
    let result;

    try {
        connection = await mysql.createConnection(dbConfig);
        result = await connection.query(query);
    } finally {
        if(connection && connection.end) connection.end();
    }

    return result;
}