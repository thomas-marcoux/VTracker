
/**
  * @classdec Maintain a list of observer to notify all when channel is selected/unselected
  * @memberof channelObserver
  */
class ChannelObserver{
    constructor() {
      this.observers = [];
    }
  
    /* Add an observer to this.observers.*/
    addObserver(observer) {
      this.observers.push(observer);
    }
  
    /* Remove an observer from this.observers. */
    removeObserver(observer) {
      const removeIndex = this.observers.findIndex(obs => {
        return observer === obs;
      });
  
      if (removeIndex !== -1) {
        this.observers = this.observers.slice(removeIndex, 1);
      }
    }
  
    /**
     * Loops over this.observers and calls the update method on each observer.
    * The state object will call this method everytime it is updated.
    */
    notify(data) {
      if (this.observers.length > 0) {
        this.observers.forEach(observer => observer.update(data));
      }
    }
  
    /* The state object will call this methode on each observer*/
    notify() {
      if (this.observers.length > 0) {
        this.observers.forEach(observer => observer.updateObserver());
      }
    }
  }
