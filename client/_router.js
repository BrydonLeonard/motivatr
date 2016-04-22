Router.configure({
    layoutTemplate:'defaultLayout',
    preload:{
        verbose:true,
        timeout:5000
    }
});

Router.route('/home', function(){
    this.render('todoContainer');
});

var myController = PreloadController.extend({
    preload: {
        verbose:true,
        //sync: './imports/cytoscape.js'
    }
});

Router.route('/tree', function() {
    this.render('treeContainer')
    },{
    controller:myController,
    preload: {
        verbose:true,
        timeout:5000,
        //sync: './imports/cytoscape.js'
    }
});

Router.route('/desktop', function() {
    this.render('desktop');
});

Router.route(/\/.*/,function() {
    Router.go('home');
});