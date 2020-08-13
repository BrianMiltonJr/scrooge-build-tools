const Transform = require('stream').Transform;
const sequences = require('./ansi_sequences.json');

class ChatPacker extends Transform {

    constructor() {
        super();
    }

    _transform(chunk, enc, next) {
        const ansiCodes = this.getAnsiCodes(chunk);
        this.push(ansiCodes);
        next();
    }

    getAnsiCodes(chunk) {
        let sequencePass = false;
        let currentCode = 0;
        let codes = [];

        for(let i = 0; i < chunk.length; i++) {
            const byte = chunk[i];

            if(byte === 27) {
                sequencePass = true;
                codes[currentCode] = {start: i, sequence: "", end: null};
                continue;
            }

            if(sequencePass) {
                if(byte === 109) {
                    sequencePass = false;
                    codes[currentCode].end = i+1;
                    currentCode += 1;
                    continue;
                }
                codes[currentCode].sequence += chunk.toString("utf-8", i, i+1);
            }
        }

        if(codes.length > 0)
            return this.replaceCodeInBuffer(codes, chunk);
        else
            return chunk;
    }

    replaceCodeInBuffer(codes, chunk) {
        let tempParts = [];
        for(let i = 0; i < codes.length; i++) {
            let current = codes[i];
            let ansiCode = sequences[current.sequence];
            if(ansiCode === "reset")
                continue;
            
            let next = codes[i+1];
            if(next !== undefined)
                tempParts.push(Buffer.concat([Buffer.from(`%${ansiCode}%`), chunk.slice(current.end, next.start)]));
            else
                tempParts.push(chunk.slice(current.end));
        }

        return Buffer.concat(tempParts);
    }
 }

 exports.ChatPacker = ChatPacker;