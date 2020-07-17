const Config = require('./config_control.js').ConfigControl;
const Addons = require('./addons.js').addons;
const Helper = new require('./helper').helper;
const { spawn }  = require('child_process');
const path = require('path');
const NodeGit = require("nodegit");
const fs = require('fs');
const EventEmitter = require('events');

class Server extends EventEmitter{
    constructor(){
        super();
        EventEmitter.call(this);

        this.game = "RedM";
        this.version = "2431";
        this.buildables = [
            {
                type: "core",
                location: "http://runtime.fivem.net/artifacts/fivem/build_proot_linux/master/2431-350dd7bd5c0176216c38625ad5b1108ead44674d/fx.tar.xz",
                method: "tar xz"
            },
            {
                type: "resources",
                location: "https://github.com/citizenfx/cfx-server-data.git",
                method: "git clone"
            }
        ];

        this.process = null;
        this.running = false;
        this.exists = fs.existsSync(`${path.resolve(__dirname, '..')}/server-core`);

        this.addons = new Addons();
        this.config = new Config();

        this.stdin = null;
        this.stdout = null;

        if(this.exists) {
            this.addons.emit('setup');
            this.config.emit('read');
        } else {
            this.addons.emit('resyncAnnex');
            this.config.emit('fresh');
        }

        this.once('setup', this.setup);
        this.on('run', this.run);
        this.on('build', this.build);
        this.on('stop', this.stop);
        this.on('input', this.input);
        this.on('output', this.output);
        this.on('remove', this.remove);
    }

    setup() {
        this.addons.emit('postSetup', this.config.ensure);
    }

    async build(){
        if(this.exists)
            return null;

        let core = `${path.resolve(__dirname, '..')}/server-core`;
        let addons = `${path.resolve(__dirname, '..')}/server-addons`;
        
        console.log("Creating Server Base Directories")
        Helper.createDir(core);
        Helper.createDir(addons);

        try {
            for(let a=0; a < this.buildables.length; a++) {
                let buildable = this.buildables[a];

                console.log(`\r\nInstalling ${buildable.type} using ${buildable.method}`);

                switch(buildable.method) {
                    case "tar":
                        let tarResp = await Helper.generateRequest(buildable.location, core, false);

                        if(!tarResp) {
                            console.error(tarResp)
                        }
                        //console.log(`tarResp: ${tarResp}`);
                    break;

                    case "tar xz":
                        let tarXzResp = await Helper.generateRequest(buildable.location, core);

                        if(!tarXzResp) {
                            console.error(tarXzResp)
                        }
                        //console.log(`tarXzResp: ${tarXzResp}`);
                    break;

                    case "git clone":
                        const cloneRepository = NodeGit.Clone(buildable.location, addons, {});
                        console.log("Git clone finished");
                    break;
                }
            }

            console.log(`\r\nWriting config.`);
            this.config.emit('write');

            console.log(`\r\nFinished building server.`);
            this.exists = true;
        } catch (err) {
            console.error(err);
        }
    }

    async run() {
        if(this.running) {
            console.log("Server is already running");
            return false;
        }
        let core = `${path.resolve(__dirname, '..')}/server-core`;
        let addons = `${path.resolve(__dirname, '..')}/server-addons`;

        console.log("Starting Server");

        try {
            this.stdout = await Helper.buildStream('write');
            this.stdin = await Helper.buildStream('read');

            //Spawn a child process and route the Standard Input, Output, and Error channels to this process' Standard Input, output, and error channels.
            this.process = spawn(`${core}/run.sh`, [`+exec`, `./server.cfg`, `+set`, `gamename`, `rdr3`], {
                cwd: addons,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            this.process.stdout.pipe(this.stdout);
            this.stdin.pipe(this.process.stdin);

            this.process.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
                this.running = false;
            });

            this.running = true;
        } catch (err) {
            console.error(err);
        }
    }

    stop() {
        this.config.emit('write');
        this.process.kill();
        this.running = false;
        this.stdin = null;
        this.stdout = null;
    }

    input(command) {
        if(this.stdin !== null) {
            this.stdin.append(`${command}\r\n`);
        }
    }

    output() {
        if(this.stdout !== null) {
            console.log(this.stdout.toString());
        }
    }

    remove() {
        if(this.running) {
            console.log("Closing and flushing object state of server");
            stop();
            this.config = new Config();
        }
        console.log("Beginning to remove Server Directories and files permanently.")
        Helper.deleteFolderRecursive(`${path.resolve(__dirname, '..')}/server-core`);
        Helper.deleteFolderRecursive(`${path.resolve(__dirname, '..')}/server-addons`);
        console.log("Deletion Complete");
    }
}

exports.Server = Server;