const fs = require('fs');
const http = require('http');
const https = require('https');
const tar = require('tar');
const xz = require('xz');
const path = require('path');
const NodeGit = require("nodegit");
const mysql = require("mysql");
const streams = require('memory-streams');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'scrooge'
});

class Helper {

    static gitClone(location, src) {
        return new Promise((resolve, reject) => {
            try {
                const cloneRepository = NodeGit.Clone(src, location, {});
                console.log(`Git clone of ${location} finished`);
                resolve(true);
            } catch(err) {
                reject(err);
            }
            
        });
    }

    static dirExists(location, folder, exact = true) {
        return new Promise((resolve, reject) => {
            let directories = fs.readdirSync(location);

            try {
                for (let i = 0; i < directories.length; i++) {
                    if(exact) {
                        if(directories[i] === folder) {
                            resolve([true, directories[i]]);
                        }
                    } else {
                        console.log(directories[i], folder);
                        if(directories[i].includes(folder)){
                            resolve([true, directories[i]]);
                        }
                    }
                }
                resolve([false]);
            } catch(err) {
                reject(err);
            }
        });
    }

    static createDir(directory) { 
        try {
            fs.statSync(directory);
        } catch(e) {
            fs.mkdirSync(directory, {recursive: true});
        }
    }

    static deleteFolderRecursive (Path) {
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
    }

    static generateRequest(location, cwd, uncompress = true, strip = 0) {
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
                                cwd: cwd, sync: true,
                                strip: strip
                            }));
                        } else {
                            response.pipe(tar.x({
                                cwd: cwd, sync: true,
                                strip: strip
                            }));
                        }
                    });

                    req.on('finish', () => {
                        console.log(`${location} finished downloading and unpacking`);
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
                                cwd: cwd, sync: true,
                                strip: strip
                            }));
                        } else {
                            response.pipe(tar.x({
                                cwd: cwd, sync: true,
                                strip: strip
                            }));
                        }
                    });

                    req.on('finish', () => {
                        console.log(`${location} finished downloading and unpacking`);
                        resolve(true);
                    });
                } catch(err) {
                    reject(err);
                }
            });
        }
    }

    static buildStream(type) {
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

    static queryDb(query) {
        return new Promise( (resolve, reject) => {
            connection.connect();
            connection.query(query, function(error, results, fields) {
                if (error) throw reject(error);
                resolve(results);
            });
        });
        
    }

    static buildStream(type) {
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
}

exports.helper = Helper;