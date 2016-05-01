import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { itemCollection } from '../dbSetup';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import './menu.html';

let breadcrumbDep = new Tracker.Dependency;
let breadcrumbs = [{name:'home', key:'root', num:0}];

Template.todoContainer.onCreated(function(){
    Session.set('activeItem', null);
    Session.set('selectedItem', null);
    Meteor.subscribe('itemCollection');
});

Template.todoContainer.events({
    /**
     * Add child button is clicked
     * @param event
     */
    'click #add':function(event){
        event.preventDefault();
        let name = prompt('Event name');
        if (name){
            let activeId = Session.get('activeItem') ? Session.get('activeItem') : null;
            Meteor.call('addChild', activeId, name);
        }
    },
    /**
     * Back button is clicked
     * @param event
     */
    'click #back':function(event){
        event.preventDefault();
        goBack();
    },
    /**
     * A breadcrumb is clicked
     * @param event
     */
    'click .breadcrumb':function(event){
        //Get the number of nodes up the tree we must move
        let iter = $('.breadcrumb').length - ($(event.target).index() + 1);
        for (let i = 0; i < iter; i++){
            goBack();
        }
    },
    //Below this point are events for buttons that relate to clicking on a leaf node
    /**
     * Toggle complete button is clicked
     * @param event
     */
    'click #done':function(event){
        event.preventDefault();
        Meteor.call('toggleComplete', Session.get('selectedItem'));
        closeFab();
    },
    /**
     * Remove item button is clicked
     * @param event
     */
    'click #remove':function(event){
        event.preventDefault();
        if (confirm('Are you sure?')){
            Meteor.call('removeNode', Session.get('selectedItem'));
            Session.set('selectedItem', null);

            let thisNode = itemCollection.findOne(Session.get('activeItem'));
            closeFab();

            if (thisNode && thisNode.children.length - 1 === 0){
                goBack();
            }
        }
    },
    'click #splitChild':function(event){
        event.preventDefault();
        let name = prompt('Enter subtask name');
        if (name){
            Meteor.call('addChild', Session.get('selectedItem'), name, function(e, _id){
                let moveTo = itemCollection.findOne(Session.get('selectedItem'));
                goToChild(moveTo._id, moveTo.name);
                closeFab();
            });

        }
    }
});

Template.todoContainer.helpers({
    /**
     * Gets the children of currently selected item or all root nodes if no item is selected
     * @returns The children
     */
    item:function(){
        if (!Session.get('activeItem')){
            return itemCollection.find({level:0});
        }

        let children = itemCollection.findOne(Session.get('activeItem')).children;
        return itemCollection.find({
            _id:{
                $in:children
            }
        });
    },
    /**
     * Returns the percentage completion for a given node. Formatted as a percentage
     * @returns {String}
     */
    donePercentage:function(){
        if (!Session.get('activeItem')){
            return formatPerc(totalComp());
        }
        return formatPerc(completePerc(Session.get('activeItem')));
    },
    /**
     * Returns the array of breadcrumbs as Strings
     * @returns {[String]}
     */
    breadcrumbs:function(){
        breadcrumbDep.depend();
        return breadcrumbs;
    },
    //Below are the helpers for selected items
    /**
     * Checks whether the currently selected node is the root
     * @returns {boolean}
     */
    root:function(){
        return !Session.get('activeItem');
    },
    /**
     * Returns true if a node is currently selected
     * @returns {Boolean}
     */
    itemSelected:function(){
        if (Session.get('selectedItem')){
            return true;
        }
        return false;
    },
    'isDone':function(){
        let thisItem = itemCollection.findOne(Session.get('selectedItem'));
        if (thisItem && thisItem.done){
            return true;
        }
        return false;
    }
});

Template.itemTemp.helpers({
    /**
     * Get the name of the current item
     * @returns {String}
     */
    name:function(){
        return this.name;
    },
    /**
     * The percentage completion of the current item
     * @returns {String}
     */
    'percentage':function(){
        if (this.children.length > 0){
            return this.complete * 100 + '%';
        } else {
            return this.done ? '100%' : '0%';
        }
    },
    /**
     * Gets the number of incomplete descendants of an item
     * @returns {string}
     */
    'numNotDone':function(){
        if (this.descendants > 0) {
            let num = this.descendants - this.completeDescendants;
            return num > 0 ? num + ' left' : '<i class="material-icons">done</i>';
        }else{
            return this.done ? '<i class="material-icons">done</i>' : '<i class="material-icons">clear</i>';
        }
    },
    'isActive':function(){
        return (this._id == Session.get('selectedItem')) ? ' active' : '';
    }
});

Template.itemTemp.events({
    /**
     * Updates the selected item
     * @param event
     */
    'click .itemLink':function(event){
        event.preventDefault();
        if (this.children.length > 0){
            goToChild(this._id, this.name);
            closeFab();
        } else {
            if (Session.get('selectedItem') === this._id){
                Meteor.call('toggleComplete', Session.get('selectedItem'));
            } else {
                Session.set('selectedItem', this._id);
                Tracker.afterFlush(function () {
                    openFab();
                });
            }
        }
    }
});

/**
 * Moves the active child to the one with the provided _id
 * @param _id The id of the child
 * @param name The name of the child
 */
let goToChild = function(_id, name) {
    breadcrumbs.push({name:name, 'key':_id});
    breadcrumbDep.changed();
    Session.set('activeItem', _id);
    Session.set('selectedItem', null);
};


/**
 * Go up one level in the item tree
 */
let goBack = function(){
    let current = itemCollection.findOne(Session.get('activeItem'));
    if (current){
        Session.set('activeItem', current.parent);
        breadcrumbs.splice(breadcrumbs.length - 1);
        breadcrumbDep.changed();
        Session.set('selectedItem', null);
        closeFab();
    }
};

/**
 * Uses the descendants and completeDescendants pr1rties to calculate the completion ratio of a given node.
 * @param _id ID of the node to check
 * @returns {number}
 */

let completePerc = function(_id){
    let node = itemCollection.findOne(_id);
    if (node){
        if (node.descendants > 0) {
            return node.completeDescendants / node.descendants;
        }
        return node.done ? 1 : 0;
    }
    return 0;
};

/**
 * Get the total completion.
 * @returns {number}
 */
let totalComp = function(){
    let topLevelItems = itemCollection.find({level:0}).fetch();

    let sum = 0;
    let count = 0;
    for (var i = 0; i < topLevelItems.length; i++){
        if (topLevelItems[i].descendants === 0){
            sum += topLevelItems[i].done ? 1 : 0;
        } else {
            sum += topLevelItems[i].completeDescendants;
            sum += (topLevelItems[i].completeDescendants === topLevelItems[i].descendants) ? 1 : 0;
        }
        count += topLevelItems[i].descendants;
    }
    return sum / (count + topLevelItems.length);
};

/**
 * Formats a ratio as a percentage
 * @param perc The ratio
 * @returns {string}
 */
let formatPerc = function(perc){
    return (perc*100).toFixed(2) + '%';
};

/**
 * Opens the fab controls
 */
let openFab = function(){
    $('#controls-fab').openFAB();
};

let closeFab = function(){
    $('#controls-fab').closeFAB();
};