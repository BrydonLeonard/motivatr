import { Tracker } from 'meteor/tracker';
import { Materialize } from 'meteor/materialize:materialize'
import './signup.html';

Template.signup.events({
    /**
     * When either password field is changed
     */
    'keyup #password1, keyup #password2'(){
        if ($('#password1').val() != $('#password2').val()){
            $('#password1').addClass('nomatch');
            $('#password2').addClass('nomatch');
            console.log('1');
        } else {
            $('#password1').removeClass('nomatch');
            $('#password2').removeClass('nomatch');
            console.log('2');
        }
    },
    /**
     * Submit the signup form
     * @param event
     */
    'submit #signupForm'(event){
        event.preventDefault();

        if (event.target.password1.value === event.target.password2.value) {

            let password = event.target.password1.value;
            let username = event.target.username.value;
            let email = event.target.email.value;

            let data = {
                username,
                password,
                emails: [email]
            };

            Accounts.createUser(data, function (error) {
                if (!error) {
                    Router.go('menu');
                } else {
                    Materialize.toast('Something went wrong', 4000);
                    console.log("YOU NEED TO MODIFY THE ERROR TOAST");
                    console.log('here is the error');
                    console.log(error);
                }
            });
        } else {
            Materialize.toast('Passwords don\'t match', 4000);
        }
    }
});