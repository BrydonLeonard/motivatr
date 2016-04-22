/**
 * Created by biGb on 4/19/2016.
 */
import { EventListener } from './EventHandler';
import { Meteor } from 'meteor/meteor'

import tree from 'jqtree';

let state = null;
let selectedState = null;

let inputHandler = new EventListener(function(event){
    event.preventDefault();
    switch(event.keyCode){
        case 32:addChild(); //space
            break;
        case 67:complete(); //c
            break;
        case 68:removeNode(); //d
            break;
        case 82:rename(); //r
            break;
        case 71:addGroup() //g
            break;
    }
    state = $('#tree1').tree('getState');
});

let blocking = false;

let addChild = function(){
    var node = $('#tree1').tree('getSelectedNode');
    let newName = prompt('New node name');
    if (newName){
        blocking = true;
        let newId = new Meteor.Collection.ObjectID()._str;
        $('#tree1').tree('appendNode',{
            label:newName,
            id:newId
        },node);

        if (node) {
            itemCollection.insert({
                _id: newId,
                children: [],
                done: false,
                level: node.getLevel(),
                name: newName,
                parent: node.id
            });
            itemCollection.update({_id: node.id}, {$push: {children: newId}});
            let match = / \[DONE]/.exec(node.name);
            $('#tree1').tree('openNode', node);
            selectedState = $('#tree1').tree('selectNode', node);
        } else {
            itemCollection.insert({
                _id: newId,
                children: [],
                done: false,
                level: 0,
                name: newName,
                parent: null
            });
            selectedState = $('#tree1').tree('selectNode', $('#tree1').tree('getNodeById', newId));
        }
    }
};

let complete = function(){
    let selectedNode = $('#tree1').tree('getSelectedNode');
    recComplete(selectedNode);
    let selectedNodes = $('#tree1').tree('getSelectedNodes');
    if (selectedNodes.length > 1){
        for (var i = 1; i < selectedNodes.length; i++){
            $('#tree1').tree('removeFromSelection', selectedNodes[i]);
        }
    }
    console.log(selectedNodes);
    console.log($('#tree1').tree('getSelectedNodes'));

};

let recComplete = function(node){
    for (var i = 0; i < node.children.length; i++){
        recComplete(node.children[i]);
    }
    if (!(/ \[DONE]/.exec(node.name))){
        $('#tree1').tree('updateNode', node, node.name + ' [DONE]');
        itemCollection.update({_id:node.id}, {$set:{done:true}});
    } else {
        let newName = node.name.slice(0,/ \[DONE]/.exec(node.name));
        $('#tree1').tree('updateNode', node, newName);
        itemCollection.update({_id:node.id}, {$set:{done:false}});
    }
}

let removeNode = function(){
    var node = $('#tree1').tree('getSelectedNode');
    if (confirm('Delete node and any of its children?')){
        itemCollection.update({_id:node.parent.id}, {$pull:{children:node.id}});
        recRemoveNode(node);
        selectedState = $('#tree1').tree('getSelectedNode').tree('moveDown');
    }
};

let recRemoveNode = function(node){
    for (var i = 0; i < node.children.length; i++){
        recRemoveNode(node.children[i]);
    }
    $('#tree1').tree('removeNode', node);
    itemCollection.remove({_id:node.id});
}

let rename = function(){
    let newName = prompt('New name');
    if (newName){
        var node = $('#tree1').tree('getSelectedNode');
        $('#tree1').tree('updateNode', node, newName);
    }
    selectedState = $('#tree1').tree('getSelectedNode');
}



let getData = function(callback){
    let data = [];
    let items = itemCollection.find({level:0}).fetch();
    for (var i = 0; i < items.length; i++){
        let temp = {id:items[i]._id, label:(items[i].name + ((completePerc(items[i]._id)==1)?" [DONE]":"")), children:[]};
        temp.children = recGetChildren(items[i]._id);
        data.push(temp);
    }
    callback(data);
};

let recGetChildren = function(_id){
    let arr = [];
    let items = itemCollection.find({parent:_id}).fetch();
    for (var i = 0; i < items.length; i++){
        let temp = {id:items[i]._id, label:(items[i].name + ((completePerc(items[i]._id)==1)?" [DONE]":"")), children:[]};
        temp.children = recGetChildren(items[i]._id);
        arr.push(temp);
    }
    return arr;
};

let addGroup = function(){
    let newName = prompt('New node name');
    if (newName){
        blocking = true;
        let newId = new Meteor.Collection.ObjectID()._str;
        $('#tree1').tree('appendNode',{
            label:newName,
            id:newId
        }, null);
        itemCollection.insert({
            _id: newId,
            children: [],
            done: false,
            level: 0,
            name: newName,
            parent: null
        });
        selectedState = $('#tree1').tree('selectNode', $('#tree1').tree('getNodeById', newId));
    }
}

Template.desktop.onRendered(function(){
    $(document).on('keydown', inputHandler.notify);
    Tracker.autorun(function () {
        if (!blocking) {
            getData(function (result) {
                if (result.length > 0) {
                    let selected = result[0].id;
                    $('#tree1').tree();
                    $('#tree1').tree('loadData', result);
                    let firstNode = $('#tree1').tree('getNodeById', selected);
                    $('#tree1').tree('selectNode', firstNode);
                    if (state){
                        $('#tree1').tree('setState', state);
                    }
                    let selectedNodes = $('#tree1').tree('getSelectedNodes');
                    if (selectedNodes.length > 1){
                        for (var i = 0; i < selectedNodes.length-1; i++){
                            $('#tree1').tree('removeFromSelection', selectedNodes[i]);
                        }
                    }
                    if (selectedState){
                        $('#tree1').tree('selectNode', selectedState);
                        console.log($('#tree1').tree('getSelectedNode'));
                    }
                }
            });
        } else {
            blocking = false;
        }
    });
});

Template.desktop.onDestroyed(function(){
    $(document).off('keydown');
});
