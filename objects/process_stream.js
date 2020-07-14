const { Duplex } = require('stream');
const kSource = Symbol('source');

class ProcessStream extends Duplex {
    constructor(options) {
        super(options);
    }

    _write(chunk, encoding, callback) {
        if (Buffer.isBuffer(chunk))
            chunk = chunk.toString();
        this[kSource].writeSomeData(chunk);
        callback();
    }

    _read(size) {
        this[kSource].fetchSomData(size, (data, encoding) => {
            this.push(Buffer.from(data, encoding));
        });
    }
}

exports.ProcessStream = ProcessStream;