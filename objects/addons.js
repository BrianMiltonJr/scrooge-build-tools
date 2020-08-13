const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const Helper = new require('./helper').helper;

class addons extends EventEmitter{

    constructor () {
        super();
        EventEmitter.call(this);

        this.enabled = [];
        this.installed = [];
        this.annex = {};

        this.once('setup', function(){ this.resyncAnnex(); this.readInstalled(); });
        this.once('postSetup', this.postSetup)
        this.on('resyncAnnex', this.resyncAnnex);
        this.on('readInstalled', this.readInstalled);
        this.on('input', this.input);
    }

    input(str) {
        let struct = str.split(" ");

        let commands = {
            3: ['install', 'remove', 'disable', 'enable']
        }

        if(Object.keys(commands).includes(String(struct.length))) {
            if(commands[struct.length].includes(struct[0])) {
                let addon = this.find(struct[1], struct[2]);
                if(addon === null) {
                    console.log('Addon does not exist, check key, value');
                    return null;
                }
                this[struct[0]](addon);
            }
        } else {
            console.log('Improper Syntax');
            return null;
        }
        
    }

    postSetup(enabledAddons) {
        for(let i = 0; i < enabledAddons.length; i++) {
            let addon = this.find('title', enabledAddons[i]);

            if(addon !== null)
                this.enabled.push(addon.id);
        }
    } 

    async resyncAnnex() {
        let addons = await Helper.queryDb('SELECT * FROM addons WHERE game = 1;');
        let annex = {};

        for(let i = 0; i < addons.length; i++) {
            let addon = addons[i];
            annex[addon.id] = addon;
        }
        this.annex = annex;
    }

    readInstalled() {
        let installed = fs.readdirSync(`${path.resolve(__dirname, '..')}/server-addons/resources/[local]`);
        for(let i = 0; i < installed.length; i++) {
            if(installed[i] !== ".gitkeep")
                this.installed.push(installed[i]);
        }
        
    }

    find(key, value) {
        let annex = this.annex;
        let ids = Object.keys(annex);

        if(key === 'id') {
            for(let i = 0; i < ids.length; i++) {
                if(value === ids[i]) {
                    return annex[ids[i]];
                }
            }
        } else {
            for(let i = 0; i < ids.length; i++) {
                if(value === annex[ids[i]][key]) {
                    return annex[ids[i]];
                }
            }
        }

        return null;
    }

    isEnabled(addon) {
        return this.enabled.includes(addon.title);
    }

    isInstalled(addon) {
        return this.installed.includes(addon.title);
    }

    uninstall(addon) {
        if(this.isInstalled(addon)) {
            this.installed.splice(this.installed.indexOf(addon.title), 1);
        }
    }

    dirExists(addon) {
        let directories = fs.readdirSync(`${path.resolve(__dirname, '..')}/server-addons/resources/[local]`);

        for(let i = 0; i < directories.length; i++) {
            if(directories[i] === addon.title)
                return true;
        }

        return false;
    }

    async install(addon) {
        let home = `${path.resolve(__dirname, '..')}/server-addons/resources/[local]`;
      
        if(this.dirExists(addon)) {
            console.log(`${addon.title} is already installed`);
        } else {
            console.log(`Starting installion of ${addon.title}`);

            if(addon.file === 'tar' || addon.file === 'tar.xz') {
                Helper.createDir(`${home}/${addon.title}`);
                await Helper.generateRequest(addon.location, `${home}/${addon.title}`, (addon.file === 'tar xz') ? true : false, 1);
            } else if(addon.file === 'git') {
                await Helper.gitClone(`${home}/${addon.title}`, addon.location, {});
            }

            this.installed.push(addon.title);
        }
    }

    async remove(addon) {
        let home = `${path.resolve(__dirname, '..')}/server-addons/resources/[local]`;

        if(!this.isInstalled(addon)) {
            console.log(`${addon.title} is not installed`);
            return false;
         } else {
            Helper.deleteFolderRecursive(`${home}/${addon.title}`);
            console.log(`${addon.title} has been removed successfully`);
            this.disable(addon);
            this.uninstall(addon);
            return true;
         }
    }

    enable(addon) {
        if(!this.isEnabled(addon)) {
            this.enabled.push(addon.title);
            console.log(`${addon.title} has been enabled`);
        } else {
            console.log(`${addon.title} is already been enabled`);
        }
    }

    disable(addon) {
        if(this.isEnabled(addon)){
            this.enabled.splice(this.enabled.indexOf(addon.title), 1);
            console.log(`${addon.title} has been disabled`);
        } else {
            console.log(`${addon.title} is already disabled`);
        }
    }

}

exports.addons = addons;