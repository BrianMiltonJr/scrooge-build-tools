const fs = require('fs');
const https = require('https');
const path = require('path');
// const targz = require('targz');

class addons {

    constructor (results) {
        this.list = results;
    }

    list() {
        console.log(this.list);
    };

    find(title) {
        for ( let index = 0; index < this.list.length; index++ ) {
            let addon = this.list[index];
            if ( addon.title === title ) {
                return addon;
            } 
        }

        return "That addon does not exist.";
    }

    // install(title) {
    //     let addon = this.find(title);
    //     if(typeof addon !== typeof "") {
    //         //Figure download and install locations
    //         let cache_dir = `${path.resolve(__dirname, '..')}/cache`;
    //         let install_dir = `${path.resolve(__dirname, '..')}/server-addons/resources`;
    //         let download_location = `${cache_dir}/${addon.title}/${addon.version}`;
    //         let install_location = `${install_dir}/${addon.title}`;

    //         this.directoryExists(download_location);
            
    //         //Checks to see if the addon is cached or not.
    //         if(!fs.existsSync(`${download_location}/bundle.tar.gz`)){
    //             try {
    //                 const file = fs.createWriteStream(`${download_location}/bundle.tar.gz`);
    //                 const request = https.get(addon.location, function(response) {
    //                     response.pipe(file);
    //                 });
    //             } catch (err) {
    //                 console.error(err);
    //             }
    //         }

    //         this.directoryExists(install_location);

    //         targz.decompress({
    //             src: `${download_location}/bundle.tar.gz`,
    //             dest: install_location
    //         }, function(err) {
    //             if(err) {
    //                 console.error(err);
    //             } else {
    //                 console.log(`${addon.title} finished installing.`);
    //             }
    //         });
    //         return "Addon finished installing";
    //     } else {
    //         return addon;
    //     }
    // }

    directoryExists(directory) {  
        try {
          fs.statSync(directory);
        } catch(e) {
          fs.mkdirSync(directory, {recursive: true});
        }
    }
}

exports.addons = addons;