
class ClassTunnel {
    constructor(classObj) {
        let keys = Object.keys(classObj);

        for(let i = 0; i < keys.length; i++) {
            this[keys[i]] = classObj[keys[i]];        
        }
    }

    exists(object) {
        return Object.keys(this).includes(object);
    }

    emit(object, listener, ...args) {
        if(this.exists(object))
            this[object].emit(listener, ...args);
        else
            return null;
    }
 
    //Return an executed function syncronously within one of our nestled Class Objects
    func(object, func, ...args) {
        if(this.exists(object))
            if(Object.keys(this[object]).includes(func))
                return this[object][func](...args);
            else
                return null;
        else
            return null;
    }
}

exports.ClassTunnel = ClassTunnel;