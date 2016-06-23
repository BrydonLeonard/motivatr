let itemCollection = new Mongo.Collection('items');
let analytics = new Mongo.Collection('analytics');

let initDB = function(){
    if (Meteor.isServer) {
        if (analytics.find({}).count() === 0) {
            analytics.insert({
                split: 0
            });
        }
    }
}

export { itemCollection, analytics, initDB };