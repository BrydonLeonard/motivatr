import { Meteor } from 'meteor/meteor';
import { itemCollection } from '../dbSetup';
import 'jqtree';
import './jqtree.css';
import './desktop.html';

let state = null;
let selectedState = null;

let $tree = null;
let inputHandler = function(event){
    event.preventDefault();
    switch(event.keyCode){
        case 32:addChild(); //space
            break;
        case 67:complete(); //c
            break;
        case 68:remove(); //d
            break;
        case 82:rename(); //r
            break;
        case 71:addGroup(); //g
            break;
    }
    state = $tree.tree('getState');
};

let addChild = function() {
    let node = $tree.tree('getSelectedNode');
    let newName = prompt('New node name');
    if (newName){
        let parentId = node ? node.id : null;
        Meteor.call('addChild', parentId, newName);
        let match = / \[DONE]/.exec(node.name);
        $tree.tree('openNode', node);
        selectedState = $tree.tree('selectNode', node);
    }
};


let complete = function(){
    let selectedNode = $tree.tree('getSelectedNode');
    recComplete(selectedNode);
    let selectedNodes = $tree.tree('getSelectedNodes');
    if (selectedNodes.length > 1){
        for (var i = 1; i < selectedNodes.length; i++){
            $tree.tree('removeFromSelection', selectedNodes[i]);
        }
    }
};

let recComplete = function(node){
    for (var i = 0; i < node.children.length; i++){
        recComplete(node.children[i]);
    }
    if (!(/ \[DONE]/.exec(node.name))){
        $tree.tree('updateNode', node, node.name + ' [DONE]');
        itemCollection.update({_id:node.id}, {$set:{done:true}});
    } else {
        let newName = node.name.slice(0,/ \[DONE]/.exec(node.name));
        $tree.tree('updateNode', node, newName);
        itemCollection.update({_id:node.id}, {$set:{done:false}});
    }
}

let remove = function(){
    var node = $tree.tree('getSelectedNode');
    if (confirm('Delete node and any of its children?')){
        itemCollection.update({_id:node.parent.id}, {$pull:{children:node.id}});
        recRemove(node);
        selectedState = $tree.tree('getSelectedNode').tree('moveDown');
    }
};

let recRemove = function(node){
    for (var i = 0; i < node.children.length; i++){
        recRemove(node.children[i]);
    }
    $tree.tree('removeNode', node);
    itemCollection.remove({_id:node.id});
};

let rename = function(){
    let newName = prompt('New name');
    if (newName){
        var node = $tree.tree('getSelectedNode');
        $tree.tree('updateNode', node, newName);
    }
    selectedState = $tree.tree('getSelectedNode');
};

let addGroup = function(){
    let newName = prompt('New node name');
    if (newName){
        let newId = new Meteor.Collection.ObjectID()._str;
        $tree.tree('appendNode',{
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
        selectedState = $tree.tree('selectNode', $tree.tree('getNodeById', newId));
    }
};

Template.desktop.onRendered(function(){
   // $(document).on('keydown', inputHandler);
    Meteor.call('desktopTreeData', function (e, result) {
        if (result.length > 0) {
            let selected = result[0].id;

            //Initialise tree
            $tree = $('#tree');
            $tree.tree();
            $tree.tree('loadData', result);

            //Select the first node by default
            let firstNode = $tree.tree('getNodeById', selected);
            $tree.tree('selectNode', firstNode);

            //If a tree state exists, apply it
            if (state){
                $tree.tree('setState', state);
            }

            //If more than 1 node is selected, deselect down to 1
            let selectedNodes = $tree.tree('getSelectedNodes');
            if (selectedNodes && selectedNodes.length > 1){
                for (var i = 0; i < selectedNodes.length-1; i++){
                    $tree.tree('removeFromSelection', selectedNodes[i]);
                }
            }

            //If a selected state exists, apply it
            if (selectedState){
                $tree.tree('selectNode', selectedState);
            }
        }
    });
});

Template.desktop.onDestroyed(function(){
    $(document).off('keydown');
});
