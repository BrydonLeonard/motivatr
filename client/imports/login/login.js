import './login.html';
import { Materialize } from 'meteor/materialize:materialize';
import { Router } from 'meteor/iron:router';
import * as loginErrors from './loginErrors';

Template.login.events({
    /**
     * Click login on the login form
     * @param event
     */
    'submit #loginForm':function(event){
        event.preventDefault();

        let identity = event.target.username.value;
        let password = event.target.password.value;

        Meteor.loginWithPassword(identity, password, function(error){
            if (!error){
                Router.go('menu');
            } else {
                loginErrors.unknownError();
            }
        })
    },
    /**
     * Click the facebook button on the login screen
     * @param event
     */
    'click #facebookLogin':function(event){
        event.preventDefault();
        Meteor.loginWithFacebook({}, function(e){
            if (e){
                loginErrors.unknownError();
            } else {
                Router.go('menu');
            }
        });
    }
});

Template.login.helpers({
    'version':function(){
        return Meteor.settings.public.version;
    }
});