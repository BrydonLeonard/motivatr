Router.configure({
    layoutTemplate:'defaultLayout'
});

console.log('_router.js');

Router.route('/home', function(){
    this.render('todoContainer')
    },{
    onBeforeAction:function(){
        if (!Meteor.userId){
            Router.go('login');
        }
        this.next();
    }
});

Router.route('/tree', function() {
    this.render('treeContainer')
    },{
    onBeforeAction:function(){
        if (!Meteor.userId){
            Router.go('login');
        }
        this.next();
    }
});

Router.route('/desktop', function() {
    this.render('desktop')
    },{
    onBeforeAction:function(){
        if (!Meteor.userId){
            Router.go('login');
        }
        this.next();
    }
});

Router.route('/login', function() {
    this.render('login')
    }, {
        layoutTemplate: 'blankLayout',
        onBeforeAction: function () {
            require('./imports/login/login.js');
            this.next();
        }
    }
);

Router.route(/\/.*/,function() {
    Router.go('home');
});