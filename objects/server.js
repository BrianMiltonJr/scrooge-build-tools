const Config = require('./config_control.js').ConfigControl;
const { spawn }  = require('child_process');
const path = require('path');
const NodeGit = require("nodegit");
const fs = require('fs');
const tar = require('tar');
const http = require('http');
const https = require('https');
const xz = require('xz');
const streams = require('memory-streams');
const pidusage = require('pidusage');

class Server {
    constructor(){
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
        this.addons = [
            {
                1: {
                    title: "Redem",
                    version: "0.2.1",
                    location: "https://codeload.github.com/kanersps/redem/tar.gz/0.2.1"
                }
            }
        ];
        this.serverProcess = null;
        this.running = false;

        this.config = new Config();

        this.stdin = null;
        this.stdout = null;
    }

    async build(){
        let core = `${path.resolve(__dirname, '..')}/server-core`;
        let addons = `${path.resolve(__dirname, '..')}/server-addons`;
        
        console.log("Creating Server Base Directories")
        this.directoryExists(core);
        this.directoryExists(addons);

        try {
            for(let a=0; a < this.buildables.length; a++) {
                let buildable = this.buildables[a];

                console.log(`\r\nInstalling ${buildable.type} using ${buildable.method}`);

                switch(buildable.method) {
                    case "tar":
                        let tarResp = await this.generateRequest(buildable.location, core, false);

                        if(!tarResp) {
                            console.error(tarResp)
                        }
                        //console.log(`tarResp: ${tarResp}`);
                    break;

                    case "tar xz":
                        let tarXzResp = await this.generateRequest(buildable.location, core);

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

            console.log(`\r\nFinished building server.`);
            console.log(`Writing config.`);
            this.config.write(`${path.resolve(__dirname, '..')}/server-addons/server.cfg`);
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
            this.stdout = await this.buildStream('write');
            this.stdin = await this.buildStream('read');

            //Spawn a child process and route the Standard Input, Output, and Error channels to this process' Standard Input, output, and error channels.
            this.serverProcess = spawn(`${core}/run.sh`, [`+exec`, `./server.cfg`, `+set`, `gamename`, `rdr3`], {
                cwd: addons,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            this.serverProcess.stdout.pipe(this.stdout);
            this.stdin.pipe(this.serverProcess.stdin);

            this.serverProcess.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
                this.running = false;
            });

            this.running = true;

            //Wait here till exit.
            //await onExit(serverProcess);
        } catch (err) {
            console.error(err);
        }
    }

    stop() {
        this.serverProcess.kill();
        this.running = false;
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
        console.log("Beginning to remove Server Directories and files permanently.")
        this.deleteFolderRecursive(`${path.resolve(__dirname, '..')}/server-core`);
        this.deleteFolderRecursive(`${path.resolve(__dirname, '..')}/server-addons`);
        console.log("Deletion Complete");
    }

    generateRequest(location, cwd, uncompress = true) {
        let schema = location.split(":");
        const options = {
            method: "GET",
            path: schema[1]
        }

        if(schema[0] === "http") {
            return new Promise ((resolve, reject) => {
                try {
                    const compression = new xz.Decompressor();
                    const req = http.get(location, function(response) {
                        if (uncompress) {
                            response.pipe(compression).pipe(tar.x({
                                cwd: cwd, sync: true
                            }));
                        } else {
                            response.pipe(tar.x({
                                cwd: cwd, sync: true
                            }));
                        }
                    });

                    req.on('finish', () => {
                        console.log("Download/Unpacking Finished");
                        resolve(true);
                    });
                } catch(err) {
                    reject(err);
                }
            });
        } else if(schema[0] === "https") {
            return new Promise ((resolve, reject) => {
                try {
                    const compression = new xz.Decompressor();
                    const req = https.get(location, function(response) {
                        if (uncompress) {
                            response.pipe(compression).pipe(tar.x({
                                cwd: cwd, sync: true
                            }));
                        } else {
                            response.pipe(tar.x({
                                cwd: cwd, sync: true
                            }));
                        }
                    });

                    req.on('end', () => {
                        console.log(`${location} finished downloading and unpacking`);
                        resolve(true);
                    });
                } catch(err) {
                    reject(err);
                }
            });
        }
    }

    buildStream(type) {
        if(type === "read") {
            return new Promise( (resolve, reject) => {
                try {
                    let stream = new streams.ReadableStream('');
                    
                    resolve(stream);
                } catch(err) {
                    reject(err);
                }
            });
        } else if(type === "write") {
            return new Promise( (resolve, reject) => {
                try {
                    let stream = new streams.WritableStream();

                    resolve(stream);
                } catch(err) {
                    reject(err);
                }
            });
        }
    }

    directoryExists(directory) {  
        try {
          fs.statSync(directory);
        } catch(e) {
          fs.mkdirSync(directory, {recursive: true});
        }
    }

    deleteFolderRecursive = function(Path) {
        if (fs.existsSync(Path)) {
          fs.readdirSync(Path).forEach((file, index) => {
            const curPath = path.join(Path, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
              this.deleteFolderRecursive(curPath);
            } else { // delete file
              fs.unlinkSync(curPath);
            }
          });
          fs.rmdirSync(Path);
        }
    };

    currentResources() {
        pidusage(this.serverProcess.pid, function( err, stats ){
            console.log(`\r\nServer Resources:`);
            console.log(`CPU Usage: ${Math.round(stats.cpu)}%\r\nMem Allocated: ${Math.round(stats.memory / 1048576)} MB`);
        });
    }
}

exports.Server = Server;