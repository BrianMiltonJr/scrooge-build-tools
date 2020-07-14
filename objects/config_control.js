const fs = require('fs');
const linereader = require('line-reader');
const lineByLine = require('n-readlines');
const path = require('path');

class ConfigControl {

    constructor(file = null) {
        if (file === null) {
            this.ensure = [
                'spawnmanager',
                'mapmanager',
                'basic-gamemode'
            ];
    
            this.tags = [
                'default',
                'roleplay'
            ];
    
            this.locale = 'en-US';
            this.hostname = 'FXServer, but unconfigured';
            this.maxclients = 32;
            this.steamWebApi = "";
            this.licenseKey = "9071p30mwx2o3tm5tll6liqhxbllusbi";
            this.ip = "0.0.0.0";
            this.port = "30120";
        } else {
            this.ensure = [];
            this.read(file);
        }
    }

    async read(file = `${path.resolve(__dirname, '..')}/server-addons/server.cfg`) {
        
        let lines = [];

        fs.readFileSync(file, 'utf-8').split(/\r?\n/).forEach(function(line) {
            if(line[0] !== "a") {
                lines.push(line);
            }
        });

        let build = {ensure: []};

        for(let index = 0; index < lines.length; index++) {
            let line = lines[index];
            let argument = this.splitArguments(line);

            switch(argument[0]) {
                case "endpoint_add_tcp":
                    let ipInfo = argument[1].replace("\"", "").split(":");
                    build.ip = ipInfo[0];
                    build.port = ipInfo[1];
                break;

                case "ensure":
                    build.ensure.push(argument[1]);
                break;

                case "sets":
                    if (argument[1] === "tags") {
                        build.tags = argument[2].replace("\"", "").split(", ");
                    }  else if(argument[1] === "locale") {
                        build.locale = argument[2].replace("\"", "");
                    } else if(argument[1] === "steam_webApiKey") {
                        if(argument[2].length === 2) {
                            build.steamWebApi = "";
                        } else {
                            build.steamWebApi = argument[2].replace("\"", "").split(", ");
                        }
                    }
                break;

                case "sv_hostname":
                    build.hostname = argument[1].replace("\"", "")
                break;

                case "sv_maxclients":
                    build.maxclients = argument[1];
                break;

                case "sv_licenseKey":
                    build.licenseKey = argument[1].replace("\"", "")
                break;
            }
        }

        let keys = Object.keys(build);

        for(let index = 0; index < keys.length; index++) {
            this[keys[index]] = build[keys[index]];
        }
    }

    write(file = `${path.resolve(__dirname, '..')}/server-addons/server.cfg`) {
        let writer = fs.createWriteStream(file);

        writer.write(`endpoint_add_tcp "${this.ip}:${this.port}"\r\n`);
        writer.write(`endpoint_add_udp "${this.ip}:${this.port}"\r\n`);

        for(let index = 0; index < this.ensure.length; index++) {
            writer.write(`ensure ${this.ensure[index]}\r\n`);
        }

        writer.write(`sets tags "${this.tags.join(", ")}"\r\n`);
        writer.write(`sets locale "${this.locale}"\r\n`);
        writer.write(`sv_hostname "${this.hostname}"\r\n`);

        writer.write(`add_ace group.admin command allow # allow all commands\r\nadd_ace group.admin command.quit deny # but don't allow quit\r\nadd_principal identifier.fivem:1 group.admin # add the admin to the group`);
        writer.write(`sv_endpointprivacy true\r\n`);
        writer.write(`sv_maxclients ${this.maxclients}\r\n`);
        writer.write(`set steam_webApiKey "${this.steamWebApi}"\r\n`)
        writer.write(`sv_licenseKey "${this.licenseKey}"\r\n`);

        writer.close();
    }

    ensure(command, addon) {
        let found = null;
        for(let index = 0; index < this.ensure.length; index ++){
            if(this.ensure[index] === addon) {
                found = index;
            }
        }

        if(command === 'add') {
            if (found === null) {
                this.ensure.append(addon)
            }
        } else {
            if (found !== null) {
                this.ensure = this.ensure.splice(found, 1)
            }
        }
    }

    tags(command, tag) {
        let found = null;
        for(let index = 0; index < this.tags.length; index ++){
            if(this.tags[index] === tag) {
                found = index;
            }
        }

        if(command === 'add') {
            if (found === null) {
                this.tags.append(tag)
            }
        } else {
            if (found !== null) {
                this.tags = this.tags.splice(found, 1)
            }
        }
    }

    splitArguments(string) {
        let quotes = string.indexOf(`"`);
        if(quotes === -1) {
            return string.split(" ");
        } else {
            let answer = string.substr(quotes+1).replace(/"/g,"");
            string = string.substr(0, quotes-1).split(" ");

            if(typeof string === typeof "") {
                string = [string, answer];
            } else { 
                string.push(answer);
            }
            return string;
        }
    }

    setConfigValue(key, value) {
        this[key] = value;
    }
}

exports.ConfigControl = ConfigControl;