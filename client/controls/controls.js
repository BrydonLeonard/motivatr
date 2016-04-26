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
    'click [name="desktop"]':function(event){
        event.preventDefault();
        Router.go('/desktop');
    }
});

Template.blankLayout.onRendered(function(){
    $('body').css({'padding-left':0});
});