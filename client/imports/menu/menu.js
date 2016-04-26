import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { itemCollection } from './../imports/dbSetup';
import { Session } from 'meteor/session';
import './menu.html';

let breadcrumbs = [{name:'home', key:'root', num:0}];


Template.todoContainer.onCreated(function(){
    Session.set('activeItem', null);
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
     * Toggle complete button is clicked
     * @param event
     */
    'click #done':function(event){
        event.preventDefault();
        Meteor.call('toggleComplete', Session.get('activeItem'));
    },
    /**
     * Remove item button is clicked
     * @param event
     */
    'click #remove':function(event){
        event.preventDefault();
        if (confirm('Are you sure?')){
            breadcrumbs.splice(breadcrumbs.length - 1);
            Meteor.call('removeNode', Session.get('activeItem'));
            Session.set('activeItem', current.parent);
            $('.fixed-action-btn').closeFAB();
        }
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
    }
});

/**
 * Go up one level in the item tree
 */
let goBack = function(){
    let current = itemCollection.findOne(Session.get('activeItem'));
    if (current){
        Session.set('activeItem', current.parent);
        breadcrumbs.splice(breadcrumbs.length-1);
        $('.fixed-action-btn').closeFAB();
    }
};

/**
 * Uses the descendants and completeDescendants properties to calculate the completion ratio of a given node.
 * @param _id ID of the node to check
 * @returns {number}
 */
completePerc = function(_id){
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
 * Considers the completion ratios of top-level items
 * @returns {number}
 */
let totalComp = function(){
    let topLevelItems = itemCollection.find({level:0}).fetch();
    let sum = 0;
    for (var i = 0; i < topLevelItems.length; i++){
        sum += completePerc(topLevelItems[i]._id);
    }
    return sum / topLevelItems.length;
};

/**
 * Formats a ratio as a percentage
 * @param perc The ratio
 * @returns {string}
 */
let formatPerc = function(perc){
    return (perc*100).toFixed(2) + '%';
};

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
     * Returns true if the active node has no children
     * @returns {Boolean}
     */
    noChildren:function(){
        let thisItem = itemCollection.findOne(Session.get('activeItem'));
        if (thisItem) {
            return (!thisItem.children.length);
        }
        return false;
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
     * Checks whether all items are complete
     * @returns {boolean}
     */
    done:function(){
        if (Session.get('activeItem')){
            return totalComp() == 1;
        }
        return completePerc(Session.get('activeItem')) == 1;
    },
    /**
     * Returns the array of breadcrumbs as Strings
     * @returns {[String]}
     */
    breadcrumbs:function(){
        return breadcrumbs;
    },
    /**
     * Checks whether the currently selected node is the root
     * @returns {boolean}
     */
    root:function(){
        return !Session.get('activeItem');
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
            return num > 0 ? num + ' left' : '<i class="material-icons">done_all</i>';
        }else{
            return this.done ? '<i class="material-icons">done</i>' : '<i class="material-icons">clear</i>';
        }
    }
});

Template.itemTemp.events({
    /**
     * Updates the selected item
     * @param event
     */
    'click .itemLink':function(event){
        event.preventDefault();
        breadcrumbs.push({name:this.name, 'key':this._id});
        Session.set('activeItem', this._id);
        $('.fixed-action-btn').closeFAB();
    }
});



let countNotDone = function(item){
    let thisItem = itemCollection.findOne({_id:item});
    if (thisItem) {
        let thisChildren = thisItem.children;
        let count = 0;
        if (thisChildren.length > 0) {
            for (var i = 0; i < thisChildren.length; i++){
                count += countNotDone(thisChildren[i]);
            }
            return count;
        } else {
            return thisItem.done?0:1;
        }
    }
};

