import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { itemCollection } from '../dbSetup';

import './profile.html';

Template.profile.helpers({
    'defaultName':function(){
        return Meteor.user().username;
    },
    'defaultEmail':function(){
        return Meteor.user().email;
    }
});

Template.profile.onCreated(function(){

})