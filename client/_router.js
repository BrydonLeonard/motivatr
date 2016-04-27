Router.configure({
    layoutTemplate:'defaultLayout'
});

console.log('_router.js');

Router.route('/menu', function(){
    this.render('todoContainer')
    },{
        name:'menu',
    onBeforeAction:function(){
        if (!Meteor.userId){
            Router.go('login');
        }
        require('./imports/menu/menu.js');
        this.next();
    }
});

Router.route('/tree', function() {
    this.render('treeContainer')
    },{
        name: 'tree',
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
        name:'desktop',
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
});