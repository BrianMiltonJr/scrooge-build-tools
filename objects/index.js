//An attempt at procedurally loading all these objects into the exports, will work on it later.
// const fs = require('fs');

// let files = fs.readdirSync(__dirname, {withFileTypes: false});
// console.log(files);

// files.map((file, index) => {
//     let name = file.substr(0, file.lastIndexOf-3);
//     exports[name] = require(`./${name}`);
// });
exports.Addons = require('./addons').addons;
exports.ConfigControl = require('./config_control').ConfigControl;
exports.Server = require('./server').Server;
exports.ProcessStream = require('./process_stream').ProcessStream;
exports.Helper = require('./helper').Helper;
exports.ChatPacker = require('./chat_packer').ChatPacker;