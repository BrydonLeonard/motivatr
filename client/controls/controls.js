import { Router } from 'meteor/iron:router';
import 'meteor/materialize:materialize';
import './controls.html';
import * as aboutModal from '../imports/modals/aboutModal';

Template.sidenav.onCreated(function(){
    aboutModal.addToTemplate($('body')[0]);
});

Template.sidenav.onRendered(function(){
    if(detectMobile() == true){
        $('.button-collapse').sideNav({
            closeOnClick: true
        });
    }
    else{
        $('.button-collapse').sideNav({
        });
    }

    $('.collapsible').collapsible();
});

function detectMobile() {
    if( navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)){
        return true;
    }
    else {
        return false;
    }
}

Template.sidenav.events({
    'click #navMenu':function(event){
        event.preventDefault();
        Router.go('/home');
    },
    'click #navTree':function(event){
        event.preventDefault();
        Router.go('/tree');
    },
    'click #navLogout':function(event){
        event.preventDefault();
        $('.side-nav').sideNav('hide');
        Meteor.logout();
    },
    'click #navProfile':function(event){
        event.preventDefault();
        Router.go('/profile');
    },
    'click #navAbout':function(event){
        event.preventDefault();
        aboutModal.displayModal();
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
            if (Meteor.user().profile && Meteor.user().profile.name){
                return Meteor.user().profile.name;
            }
            return Meteor.user().username;
        }
        return '';
    },
    'social':function(){
        let user = Meteor.user();
        if (!user){
            return
        }
        return !(!user.services);
    }
})

Template.blankLayout.onRendered(function(){
    $('body').addClass('no-left-padding');
});

Template.blankLayout.onDestroyed(function(){
    $('body').removeClass('no-left-padding');
})