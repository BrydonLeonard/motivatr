class EventHandler {
    static addListener(listener){
        if (typeof _listeners == 'undefined'){
            _listeners = [listener];
        } else {
            _listeners.push(listener);
        }
    }
    static notifyListeners(event){
        for (listener of _listeners){
            listener.notify(event);
        }
    }
    static removeListener(removeList){
        for (var i = 0; i < _listeners.length; i++){
            if (_listeners[i] === removeList){
                _listeners[i].splice(i, 1);
                return true;
            }
        }
        return false;
    }
}

class EventListener {
    constructor(notifyFunction){
        if (notifyFunction) {
            this.notify = notifyFunction;
        }
    }

    notify(event){
        console.log('Event notification not yet implemented');
    }
}

export { EventListener }