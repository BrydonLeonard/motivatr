import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';

itemCollection = new Mongo.Collection('items');

let itemDep = new Tracker.Dependency;

let breadcrumbs = [{name:'root', key:'root', num:0}];

import './main.html';

var activeItem;

Template.todoContainer.onCreated(function(){
    itemDep.changed();
});

Template.todoContainer.helpers({
    'item':function(){
        itemDep.depend();
        if (!activeItem){
            return itemCollection.find({level:0});
        }
        let children = itemCollection.findOne(activeItem).children;
        return itemCollection.find({_id:{$in:children}});
    },
    'noChildren':function(){
        itemDep.depend();
        if (!activeItem){
            return false;
        } else {
            let thisItem = itemCollection.findOne(activeItem);
            if (thisItem){
                if (!thisItem.children.length){
                    return true;
                } else {
                    return false;
                }
            }
        }
    },
    'donePercentage':function(){
        itemDep.depend();
        if (!activeItem){
            return formatPerc(totalComp());
        }
        return formatPerc(completePerc(activeItem));
    },
    'done':function(){
        itemDep.depend();
        if (!activeItem){
            return totalComp() == 1;
        }
        return completePerc(activeItem) == 1;
    },
    'breadcrumbs':function(){
        itemDep.depend();
        return breadcrumbs;
    },
    'root':function(){
        itemDep.depend();
        return !activeItem;
    }
});

Template.todoContainer.events({
    'click #add':function(event){
        event.preventDefault();
        let name = prompt('event name');
        if (name){
            if (!activeItem){
                itemCollection.insert({
                    level:0,
                    children:[],
                    name,
                    done:false,
                    parent:null
                });
            } else {
                let parent = itemCollection.findOne(activeItem);
                if (parent) {
                    _id = (new Meteor.Collection.ObjectID())._str;
                    itemCollection.insert({
                        _id,
                        level: parent.level + 1,
                        children: [],
                        name,
                        done: false,
                        parent: parent._id
                    });
                    itemCollection.update({_id: parent._id}, {$push: {children: _id}});
                } else {
                    _id = (new Meteor.Collection.ObjectID())._str;
                    itemCollection.insert({
                        _id,
                        level: 0,
                        children: [],
                        name,
                        done: false,
                        parent: null
                    });
                    itemCollection.update({_id: parent._id}, {$push: {children: _id}});
                }
            }
        }
    },
    'click #back':function(event){
        event.preventDefault();
        goBack();
    },
    'click #done':function(event){
        event.preventDefault();
        let current = itemCollection.findOne(activeItem);
        if (current){
            itemCollection.update({_id:activeItem}, {$set:{done:!current.done}});
        }
    },
    'click #remove':function(event){
        event.preventDefault();
        if (confirm('are you sure?')){
            let current = itemCollection.findOne(activeItem);
            if (current) {
                activeItem = current.parent;
                breadcrumbs.splice(breadcrumbs.length - 1);
                itemCollection.remove(current._id);
                itemCollection.update(current.parent, {$pull: {children: current._id}});
                console.log(current.parent);
                itemDep.changed();
            }
            $('.fixed-action-btn').closeFAB();
        }
    },
    'click .breadcrumb':function(event){
        var iter = $('.breadcrumb').length - ($(event.target).index() + 1);
        for (var i = 0; i < iter; i++){
            goBack();
        }
    }
});

let goBack = function(){
    let current= itemCollection.findOne(activeItem);
    if (current){
        activeItem = current.parent;
        breadcrumbs.splice(breadcrumbs.length-1);
        $('.fixed-action-btn').closeFAB();
        itemDep.changed();
    }
}

Template.itemTemp.helpers({
    'name':function(){
        return this.name;
    },
    'percentage':function(){
        if (this.children.length > 0){
            return completePerc(this._id)*100 + '%';
        } else {
            return this.done?'100%':'0%';
        }
    },
    'numNotDone':function(){
        if (this.children.length > 0) {
            let num = countNotDone(this._id);
            return num > 0?num + ' left':'<i class="material-icons">done_all</i>';
        }else{
            return this.done?'<i class="material-icons">done</i>':'<i class="material-icons">clear</i>';
        }
    }
});

Template.itemTemp.events({
    'click .itemLink':function(event){
        event.preventDefault();
        console.log(this);
        breadcrumbs.push({name:this.name, 'key':this._id});
        activeItem = this._id;
        itemDep.changed();
        $('.fixed-action-btn').closeFAB();
    }
});

let formatPerc = function(perc){
    return (perc*100).toFixed(2) + '%';
}

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

completePerc = function(item){
    let thisItem = itemCollection.findOne({_id:item});
    if (thisItem) {
        let thisChildren = thisItem.children;
        var sum = 0;
        if (thisChildren.length > 0) {
            for (var i = 0; i < thisChildren.length; i++) {
                sum += completePerc(thisChildren[i]);
            }
            return sum / thisChildren.length;
        } else {
            return thisItem.done?1:0;
        }
    }
    return 0;
};

let totalComp = function(){
    let topLevelItems = itemCollection.find({level:0}).fetch();
    let sum = 0;
    for (var i = 0; i < topLevelItems.length; i++){
        sum += completePerc(topLevelItems[i]._id);
    }
    return sum / topLevelItems.length;
};