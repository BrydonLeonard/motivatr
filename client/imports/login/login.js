import './login.html';

Template.login.events({
    'submit #loginForm':function(event){
        event.preventDefault();

        let identity = event.target.username.value;
        let password = event.target.password.value;

        Meteor.loginWithPassword(identity, password, function(error){
            if (!error){
                Router.go('menu');
            } else {
                Materialize.toast('Login failed', 4000);
            }
        })
    }
});
