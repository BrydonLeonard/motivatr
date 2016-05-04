import { Router } from 'meteor/iron:router';
import 'meteor/materialize:materialize';
import './controls.html';

console.log('controls.js');

Template.sidenav.onRendered(function(){
    $('.button-collapse').sideNav({
    });
    $('.collapsible').collapsible();
});

Template.sidenav.events({
    'click [name="menu"]':function(event){
        event.preventDefault();
        Router.go('/home');
    },
    'click [name="tree"]':function(event){
        event.preventDefault();
        Router.go('/tree');
    },
    'click [name="logout"]':function(event){
        event.preventDefault();
        $('.side-nav').sideNav('hide');
        Meteor.logout();
    }
    /**
    'click [name="desktop"]':function(event){
        event.preventDefault();
        Router.go('/desktop');
    },**/
});

Template.sidenav.helpers({
    name: function(){
        if (Meteor.user()) {
            if (Meteor.user().profile.name){
                return Meteor.user().profile.name;
            }
            return Meteor.user().username;
        }
    }
})

Template.blankLayout.onRendered(function(){
    $('body').css({'padding-left':0});
});