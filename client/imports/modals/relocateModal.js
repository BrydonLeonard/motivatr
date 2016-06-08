import './relocateModal.html';

let siblings = [];
let parent = {};
let currentNode = {};
let callback = null;

let openDep = new Tracker.Dependency;

/**
 * Opens the modal to move the selected node to a new parent
 * @param params Object with params:
 *  <ul>
 *      <li>currentNode:
 *          <ul>
 *          <li>_id</li>
 *          <li>name</li>
 *          </ul>
 *      </li>
 *      <li>parentNode:
 *          <ul>
 *          <li>_id</li>
 *          <li>name</li>
 *          <li>grandparent</li>
 *          </ul>
 *      </li>
 *      <li>siblingNodes: [array]
 *          <ul>
 *          <li>_id</li>
 *          <li>name</li>
 *          </ul>
 *      </li>
 *  </ul>
 */
let displayModal = function(params){
    parent = params.parentNode;
    currentNode = params.currentNode;
    siblings = params.siblingNodes;
    if (params.callback){
        callback = params.callback;
    }
    //The node itself will actually form part of the sibling array initially
    let selfIndex = siblings.indexOf(currentNode);
    siblings.splice(selfIndex, 1);
    openDep.changed();
    $('#relocateModal').openModal();
};

Template.relocateModal.helpers({
    siblings:function(){
        openDep.depend();
        return siblings;
    },
    parent:function(){
        openDep.depend();
        return parent;
    },
    currentNode: function(){
        openDep.depend();
        return currentNode;
    },
    hasParent: function(){
        openDep.depend();
        return (parent._id != null)
    }
});

Template.relocateModal.events({
    'click .sibling-button':function(event){
        event.preventDefault();
        Meteor.call('adoptChild', currentNode._id, event.target.id);
        $('#relocateModal').closeModal();
        if (callback){
            callback();
        }
    },
    'click #cancel':function(){
        $('#relocateModal').closeModal();
    },
    'click #levelUp':function(){
        event.preventDefault();
        Meteor.call('adoptChild', currentNode._id, parent.grandparent);
        $('#relocateModal').closeModal();
        if (callback){
            callback();
        }

    }
});



/**
 * Adds the modal to the current template
 * Remember to do this before trying to use the modal
 * @param parentNode The parent node. Can be anything on the relevant template
 */
let addToTemplate = function(parentNode){
    Blaze.render(Template.relocateModal, parentNode);
};

export { addToTemplate, displayModal }