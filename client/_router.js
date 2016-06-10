import { Router } from 'meteor/iron:router';
import { Accounts } from 'meteor/accounts-base';

Router.configure({
    layoutTemplate:'defaultLayout'
});

Router.route('/menu', function(){
    this.render('todoContainer')
    },{
        name:'menu',
    onBeforeAction:function(){
        if (!Meteor.userId()){
            Router.go('login');
        }
        require('./imports/menu/menu.js');
        this.next();
    },
    waitOn(){
        Accounts.loginServicesConfigured();
    }
});

Router.route('/tree', function() {
    this.render('treeContainer')
    },{
        name: 'tree',
    onBeforeAction:function(){
        if (!Meteor.userId()){
            Router.go('login');
        }
        require('./imports/tree/tree.js');
        this.next();
    }
});

Router.route('/desktop', function() {
    this.render('desktop')
    },{
        name:'desktop',
    onBeforeAction:function(){
        if (!Meteor.userId()){
            Router.go('login');
        }
        require('./imports/desktop/desktop.js');
        this.next();
    }
});

Router.route('/profile', function() {
    this.render('profile')
    },{
        name:'profile',
    onBeforeAction:function(){
        if (!Meteor.userId()) {
            Router.go('login');
        }
        require('./imports/profile/profile.js');
        this.next();
    }
})

Router.route('/login', function() {
    this.render('login')
    }, {
        name: 'login',
        layoutTemplate: 'blankLayout',
        onBeforeAction: function () {
            require('./imports/login/login.js');
            this.next();
        }
    }
);

Router.route('/signup', function() {
    this.render('signup')
    }, {
        name:'signup',
        layoutTemplate: 'blankLayout',
        onBeforeAction: function() {
            require('./imports/signup/signup.js');
            this.next();
        }
    }
);

/**
 * Default route.
 * For now, will redirect to menu screen.
 */
Router.route(/\/.*/,function() {
        Router.go('menu');
    }
);