import { Meteor } from 'meteor/meteor';
import './analytics.html';

Template.analytics.helpers({
    numSplits:function(){
        return Meteor.user().profile.split;
    }
});