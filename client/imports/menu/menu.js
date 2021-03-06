import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { itemCollection } from '../../../shared/imports/dbSetup';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

//Modals
import * as newItemModal from '../modals/newItemModal';
import * as confirmModal from '../modals/confirmModal';
import * as relocateModal from '../modals/relocateModal';
import * as infoModal from '../modals/infoModal';
import * as editModal from '../modals/editModal';

//Template
import './menu.html';

//For time processing
import moment from '../external/moment';

//For nice animations
import { initAnimations } from '../external/animate';
import '../external/animate';
import Bounce from 'bounce.js';

let breadcrumbDep = new Tracker.Dependency;
let breadcrumbs;

let bounce;
let bounceSpin;


Template.todoContainer.onCreated(function(){
    breadcrumbs = [{ name: 'home', key: 'root', num: 0 }];
    Session.set('activeItem', null);
    Session.set('selectedItem', null);
    let tutFunc = function() {
        if (!Meteor.user().profile.tutDone) {
            Session.set('tutorial', 1);
            infoModal.displayModal('Welcome to motivatr! This app will help you to take huge, daunting projects and break them down until they\'re really easy. When you\'re ready, close this window and click the "+" button to begin',
                'Welcome');
        }
    };


    Meteor.subscribe('itemCollection', function() {
        //If we find a user with no profile, do a profileCheckup to populate their profile.
        //This should only happen on old accounts, created before the profile picture and tutorial fields
        if (!Meteor.user().profile || !Meteor.user().profile.tutDone || !Meteor.user().profile.picture || !Meteor.user().profile.name) {
            Meteor.call('profileCheckup', tutFunc);
        } else {
            tutFunc();
        }
    });

    newItemModal.addToTemplate($('body')[0]);
    confirmModal.addToTemplate($('body')[0]);
    relocateModal.addToTemplate($('body')[0]);
    infoModal.addToTemplate($('body')[0]);
    editModal.addToTemplate($('body')[0]);

    initAnimations();
    bounce = new Bounce();
    bounce.scale({
        from: { x: 1.2, y: 1.2 },
        to: { x: 1, y: 1 },
        stiffness: 1
    });
    bounceSpin = new Bounce();
    bounceSpin.scale({
        from: { x: 1.2, y: 1.2 },
        to: { x: 1, y: 1 },
        stiffness: 1
    }).rotate({
        from: 0,
        to: 360,
        duration:1300
    });

    window.onpopstate = function(event){
        goBack();
    };
    this.autorun(function() {
       let state = Session.get('tutorial');
        if (state === 2) {
            Materialize.toast('Give your project a name', 5000);
        }
        if (state === 3) {
            Materialize.toast('Tap on your new project', 5000);
        }
        if (state === 4) {
            Materialize.toast('Tap the split button', 5000);
        }
        if (state === 5) {
            infoModal.displayModal(
                'Now this is the exciting part. You need to think of some small task that you need to complete before you can finish your big task. Type it\'s name and click add',
                'Splitting');
        }
        if (state === 6) {
            infoModal.displayModal('Now you can click the "+" to add another small task, or click on the new subtask and break it down even more',
                'More subtasks');
        }
        if (state === 7) {
            Meteor.call('tutorialComplete');
            infoModal.displayModal('You now know the basics of using motivatr. All you need to do is select an item and click the tick to mark it as complete. \n\nAnother cool feature is the tree view, which you can find in the side menu. If you have any suggestions or questions, you can find our contact details in the "about" page.',
                'Where to go now',
                function() {
                    Session.set('tutorial', 8);
                });
        }
    });
});

Template.todoContainer.events({
    /**
     * Add child button is clicked
     * @param event
     */
    'click .add':function(event){
        if (Session.get('tutorial') === 1) {
            Session.set('tutorial', 2);
        } else {
            if (Session.get('tutorial') === 6) {
                Session.set('tutorial', 7);
            }
        }
        event.preventDefault();
        let activeId = Session.get('activeItem') ? Session.get('activeItem') : null;
        newItemModal.displayModal(activeId, function(e){
            if (e){
                Materialize.toast('Something went wrong', 4000);
            } else {
                if (Session.get('tutorial', 2)) {
                    Session.set('tutorial', 3);
                }
            }
        });
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
    },
    /**
     * Allows users to click the icon to toggle completion
     * @param event
     */
    'click .itemLink > i':function(event){
        event.preventDefault();
        if (!selectedHasChildren()){
            Meteor.call('toggleComplete', Session.get('selectedItem'));
        }
    },
    /**
     * Remove item button is clicked
     * @param event
     */
    'click #remove':function(event){
        event.preventDefault();

        if (selectedHasChildren()){
            confirmModal.displayModal('Are you sure you wish to delete this item and all of its children?', function(result){
                if (result){
                    Meteor.call('removeChildren', Session.get('selectedItem'));
                    Meteor.call('removeNode', Session.get('selectedItem'));
                    Session.set('selectedItem', null);

                    closeFab();
                }
            });
        } else {
            confirmModal.displayModal('Are you you wish to delete the item?', function(result){
                if (result){
                    Meteor.call('removeNode', Session.get('selectedItem'));
                    Session.set('selectedItem', null);

                    let thisNode = itemCollection.findOne(Session.get('activeItem'));
                    closeFab();

                    if (thisNode && thisNode.children.length - 1 === 0){
                        goBack();
                    }
                }
            });
        }
    },
    'click #splitChild':function(event){
        event.preventDefault();

        if (Session.get('tutorial') === 4){
            Session.set('tutorial', 5);
        } else {
            if (Session.get('tutorial') === 6) {
                Session.set('tutorial', 7);
            }
        }

        newItemModal.displayModal(Session.get('selectedItem'), function(e){
            if (e){
                Materialize.toast("Something went wrong", 4000);
            } else {
                if (Session.get('tutorial') === 5){
                    Session.set('tutorial', 6);
                }
                let moveTo = itemCollection.findOne(Session.get('selectedItem'));
                goToChild(moveTo._id, moveTo.name);
                closeFab();
                Tracker.afterFlush(function(){
                    bounceSpinFab();
                });
            }
        });
    },
    'click #openChild':function(event){
        event.preventDefault();
        let thisItem = itemCollection.findOne(Session.get('selectedItem'));
        if (thisItem) {
            goToChild(Session.get('selectedItem'), thisItem.name);
            closeFab();
            Tracker.afterFlush(function(){
                bounceSpinFab();
            });
        }
    },
    'click #export':function(event){
        event.preventDefault();
        if (Session.get('selectedItem')){
            //TODO get some caching going on here in case they repeatedly ask for the same tree
            Meteor.call('exportTree', Session.get('selectedItem'), function(e,treeString) {
                infoModal.displayModal(treeString, 'You can copy this and send it to your friends so that they can add the same tree as you:');
            });
        }
    },
    'click #increaseReps':function(event){
        event.preventDefault();
        let thisItem = itemCollection.findOne(Session.get('selectedItem'));
        if (thisItem){
            if (thisItem.repeatableLimit){
                if (thisItem.repeated < thisItem.repeatableLimit){
                    Meteor.call('increaseReps', thisItem._id);
                }
            } else {
                Meteor.call('increaseReps', thisItem._id);
            }
        }
    },
    'click #decreaseReps':function(event){
        event.preventDefault();
        let thisItem = itemCollection.findOne(Session.get('selectedItem'));
        if (thisItem){
            if (thisItem.repeated > 0){
                Meteor.call('decreaseReps', thisItem._id);
            }
        }
    },
    'click #edit':function(event){
        event.preventDefault();
        editModal.displayModal(Session.get('selectedItem'), Session.get('activeItem'));
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
    areItems: function() {
        return itemCollection.find().count() > 0;
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
    /**
     * Returns true if the currently selected node has children
     * @returns {boolean}
     */
    selectedHasChildren:function(){
        return selectedHasChildren();
    },
    /**
     * Returns true if the currently selected node is repeatable
     * @returns {Boolean}
     */
    selectedIsRepeatable:function(){
        let thisNode = itemCollection.findOne(Session.get('selectedItem'));
        if (thisNode){
            return thisNode.repeatable;
        }
        return false;
    },
    /**
     * Returns true if the currently selected item is complete
     * @returns {boolean}
     */
    isDone:function(){
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
    'doneIcon':function(){
        if (this.descendants > 0) {
            return (this.descendants == this.completeDescendants) ? 'done_all' : 'group_work';
        }else{
            return this.done ?  'done' : 'clear';
        }
    },
    'doneStyling':function(){
        if (this.descendants > 0) {
            return (this.descendants == this.completeDescendants) ? 'teal lighten-2' : 'red lighten-2';
        }else{
            return this.done ?  'teal lighten-2' : 'red lighten-2';
        }
    },
    hasIncompDescendants:function(){
        return (this.descendants > this.completeDescendants);
    },
    isRepeatable:function(){
        return this.repeatable;
    },
    numCompleteText:function(){
        if (!this.repeatable){
            return (this.descendants - this.completeDescendants) + ' remaining';
        } else {
            if (this.repeatableLimit){
                if (this.repeatableLimit === this.repeated){
                    return '';
                }
                return (this.repeatableLimit - this.repeated) + ' reps remaining';
            } else {
                return 'Done ' + this.repeated + ' times';
            }
        }
    },
    hasDate:function(){
        return !!this.date;
    },
    dateLimit:function(){
        return moment(this.date).format('DD MMMM YYYY');
    },
    'isActive':function(){
        return (this._id == Session.get('selectedItem')) ? ' active' : '';
    },
    'hasHighPriority':function(){
        return (this.priority && this.priority > 0);
    },
    'priorityColor':function(){
        switch(this.priority){
            case 1: return 'blue-text text-lighten-2';
            case 2: return 'orange-text text-lighten-2';
            case 3: return 'red-text text-lighten-2';
            default: return 'teal-text text-lighten-2';
        }
    },
    'sentiment':function(){
        switch(this.priority){
            case 1: return 'sentiment_satisfied';
            case 2: return 'sentiment_neutral';
            case 3: return 'sentiment_dissatisfied';
            default: return 'sentiment_neutral';
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

        if (Session.get('tutorial') === 3){
            Session.set('tutorial', 4);
        }
        //If nothing is selected
        if (Session.get('selectedItem') == null) {
            changeSelected(this._id);
            if ($('#controls-fab').hasClass('active')){
                closeFab();
            }
            Tracker.afterFlush(function(){
                bounceSpinFab();
                openFab();
            });
        } else if (Session.get('selectedItem') == this._id){
            //We selected the already selected one
            if (this.children.length > 0){
                //This one has children
                goToChild(this._id, this.name);
                closeFab();
                Tracker.afterFlush(function(){
                    bounceSpinFab();
                    openFab();
                });
            }
        } else {
            //We had some other one selected
            if (selectedHasChildren() != selectedHasChildren(this._id)){
                //We only want to screw with the fab if the previously selected node was of a different type to the new one
                Session.set('selectedItem', this._id);

                //Reopen the fab if it was open to begin with
                if ($('#controls-fab').hasClass('active')) {
                    Tracker.afterFlush(function () {
                        openFab();
                    });
                }
                $('#controls-fab').removeClass('active');
                Tracker.afterFlush(function(){
                    bounceFab();
                });
            } else {
                changeSelected(this._id);
            }
        }
    }
});

/**
 * Returns true if the selected item has children
 * @param _id Optional parameter of item to check for children
 * @returns {boolean}
 */
let selectedHasChildren = function(_id){
    let id = _id || Session.get('selectedItem');
    let thisItem = itemCollection.findOne(id);
    if (thisItem && thisItem.descendants > 0){
        return true;
    }
    return false;
};

let changeSelected = function(_id){
    Session.set('selectedItem', _id);
};

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
    history.pushState({id:_id}, "", name);
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
 * Uses the descendants and completeDescendants to calculate the completion ratio of a given node.
 * @param _id ID of the node to check
 * @returns {number}
 */

let completePerc = function(_id){
    let node = itemCollection.findOne(_id);
    if (node){
        if (node.descendants > 0) {
            return node.completeDescendants / node.descendants;
        } else if (node.repeatableLimit){
            return node.repeated / node.repeatableLimit;
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

/**
 * Close the fab controls
 */
let closeFab = function(){
    $('#controls-fab').closeFAB();
};

/**
 * Bounces the fab to draw attention
 */
let bounceFab = function(){
    bounce.applyTo($('#controls-fab-a'));
}

/**
 * Spins and bounces the fab to draw attention
 */
let bounceSpinFab = function(){
    bounceSpin.applyTo($('#controls-fab-a'));
}