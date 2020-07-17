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
        this.on('enable', this.enable);
        this.on('disable', this.disable);
        this.on('install', this.install);
        this.on('remove', this.remove);
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
            let keys = Object.keys(addon);
            annex[addon.id] = addon;
        }
        this.annex = annex;
    }

    readInstalled() {
        this.installed = fs.readdirSync(`${path.resolve(__dirname, '..')}/server-addons/resources/[local]`);
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

    isEnabled(id) {
        return this.enabled.includes(id);
    }

    enable(key, value) {
        let addon = this.find(key, value);

        if(addon === null)
            return null;

        if(!this.isEnabled(addon.id))
            this.enabled.push(addon.id);
    }

    disable(key, value) {
        let addon = this.find(key, value);

        if(addon === null)
            return null;

        if(this.isEnabled(addon.id)){
            let index;
            for(let i = 0; i < this.enabled.length; i++) {
                if(this.enabled === addon.id)
                    index = i;
            }

            this.enabled.splice(index, 1);
        }
    }

    isInstalled(addon) {

        let directories = fs.readdirSync(`${path.resolve(__dirname, '..')}/server-addons/resources/[local]`);

        for(let i = 0; i < directories.length; i++) {
            if(directories[i] === addon.title)
                return true;
        }

        return false;q
    }

    async install(key, value) {
        let addon = this.find(key, value);
        if(addon === null)
            return "could not find addon";

        let home = `${path.resolve(__dirname, '..')}/server-addons/resources/[local]`;
      
        if(this.isInstalled(addon)) {
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

    async remove(key, value) {
        let addon = this.find(key, value);
        if(addon === null)
            return "could not find addon";
            
        let home = `${path.resolve(__dirname, '..')}/server-addons/resources/[local]`;

        if(this.isInstalled(addon)) {
            console.log(`${addon.title} is not installed`);
            return [false, addon.title];
         } else {
            Helper.deleteFolderRecursive(`${home}/${exists[1]}`);
            console.log(`${exists[1]} has been removed successfully`);
            this.disable(key, value);
            return [true, exists[1]];
         }
    }
}

exports.addons = addons;