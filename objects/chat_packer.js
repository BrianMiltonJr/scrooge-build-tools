const Transform = require('stream').Transform;
const sequences = require('./ansi_sequences.json');

/*
    A nifty implementation of a Transform Stream. When we pipe output into this stream we loop through
    it to find escape sequences and replace them with their formatting counterpart. This is to make
    parsing for react much easier. Since server programs tend to use ASCII escape sequences instead
    of CSS color properties.

    Can be sped up by maybe preconditioning the buffer to not process unless we can confirm escape
    sequences so we aren't iterating through each byte in the streams
*/

class ChatPacker extends Transform {

    constructor() {
        super();
    }

    //Transform our incoming stream and pushed it onwards
    _transform(chunk, enc, next) {
        this.push(this.processChunk(chunk))
        next();
    }

    processChunk(chunk) {
        //What sequence are we currently parsing
        let tempSequence = "";
        //Our chunk gets split into smaller buffers with their Ansi Code replace with an easy 2 parse %colorFormat%
        let formattedChunks = [];

        //Start at the beginning of the buffer and work our way through it.
        for(let i = 0; i < chunk.length; i++) {
            //The current byte
            let byte = chunk[i];
            //Where our 2nd nested for loop will pick up to find the of this format codes reach
            let pickup = null;

            //Does this character start the escape sequence
            if(byte === 27) {

                //Work our way onwards adding every character to our tempSequence untill we reach m, once we do we set out pick up to the next byte
                for(let j = i+1; j < chunk.length; j++) {
                    if(chunk[j] !== 109) {
                        tempSequence += chunk.toString("utf-8", j, j+1)
                    } else {
                        pickup = j+1
                        break;
                    }
                }

                // We continue from our pickup then look for the next escape sequence. Once we find it we concat
                // two buffers which consist of our formatting code followed by the slice of the buffer that follows
                // onto the next escape sequence. We then set I to pick up where we left of on our primary loop
                // We also reset tempSequence
                for(let k = pickup; k < chunk.length; k++) {
                    if(chunk[k] === 27) {
                        console.log(tempSequence);
                        formattedChunks.push(Buffer.concat([Buffer.from(`%${sequences[tempSequence]}%`), chunk.slice(pickup, k)]));
                        i = k;
                        tempSequence = "";
                        break;
                    }
                }
            }
        }

        // If we actually parsed escape sequences we concat all the sub Buffers into one buffer then return it
        // else we return the original chunk unmodified
        if(formattedChunks.length > 0)
            return Buffer.concat(formattedChunks);
        else
            return chunk
    }
 }

 exports.ChatPacker = ChatPacker;