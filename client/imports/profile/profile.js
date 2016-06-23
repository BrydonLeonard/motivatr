import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { itemCollection } from '../../../shared/imports/dbSetup';
import { Accounts } from 'meteor/accounts-base';

import './profile.html';

Template.profile.helpers({
    /**
     * Returns the user's username
     * @returns {*}
     */
    'username':function(){
        if (Meteor.user() && Meteor.user().username){
            return Meteor.user().username;
        } else return 'Your profile';
    },
    /**
     * Returns the user's first email address, if they have one
     * @returns {*}
     */
    'email':function(){
        if (Meteor.user() && Meteor.user().emails){
            return Meteor.user().emails[0].address;
        } else return 'No email yet';

    }
});

Template.profile.events({
    /**
     * Clicks save password
     * @param event
     */
    'submit #changePassForm':function(event){
        event.preventDefault();
        if ($('#newPass1').val() == $('#newPass2').val()){
            Accounts.changePassword($('#currentPass').val(), $('#newPass1').val(), function(e){
                if (e){
                    Materialize.toast(e.message, 4000);
                } else {
                    Materialize.toast('Password changed successfully', 4000);
                    $('#currentPass').val('');
                    $('#currentPass').trigger('autoresize');
                    $('#newPass1').val('');
                    $('#newPass1').trigger('autoresize');
                    $('#newPass2').val('');
                    $('#newPass2').trigger('autoresize');
                }
            });
        }
    },
    /**
     * Clicks save username
     * @param event
     */
    'submit #changeUserForm':function(event){
        event.preventDefault();
        Meteor.call('changeUsername', $('#newUser').val(), function(e){
            if (e){
                Materialize.toast(e.message, 4000);
            } else {
                Materialize.toast('Username changed successfully');
                $('#newUser').val('');
                $('#newUser').trigger('autoresize');
            }
        });
    },
    /**
     * Clicks save email
     * @param event
     */
    'submit #changeEmailForm':function(event){
        event.preventDefault();
        Meteor.call('changeEmail', $('#newEmail').val(), function(e){
            if (e){
                Materialize.toast(e.message, 4000);
            } else {
                Materialize.toast('Email changed successfully');
                $('#newEmail').val('');
                $('#newEmail').trigger('autoresize');
            }
        });
    },
    /**
     * When either password field is changed
     */
    'keyup #newPass1, keyup #newPass2'(){
        if ($('#newPass1').val() != $('#newPass2').val()){
            $('#newPass1').addClass('nomatch');
            $('#newPass2').addClass('nomatch');
        } else {
            $('#newPass2').removeClass('nomatch');
            $('#newPass1').removeClass('nomatch');
        }
    }
});

Template.profile.onCreated(function(){

});