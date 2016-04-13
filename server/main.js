import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

itemCollection = new Mongo.Collection('items');

Meteor.startup(() => {
  // code to run on server at startup
});
