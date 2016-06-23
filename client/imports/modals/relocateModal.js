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
    siblings = siblings.filter(node => node._id != currentNode._id);
    openDep.changed();
    $('#relocateModal').openModal();
};

Template.relocateModal.helpers({
    /**
     * Returns all siblings of the current node
     * @returns {Array}
     */
    siblings:function(){
        openDep.depend();
        return siblings;
    },
    /**
     * Returns the parent of the current node
     * @returns {{}}
     */
    parent:function(){
        openDep.depend();
        return parent;
    },
    /**
     * Returns the current node
     * @returns {{}}
     */
    currentNode: function(){
        openDep.depend();
        return currentNode;
    },
    /**
     * Returns true if the current node has a parent
     * @returns {boolean}
     */
    hasParent: function(){
        openDep.depend();
        return (parent._id != null)
    }
});

Template.relocateModal.events({
    /**
     * Click on a sibling to have the current node adopted by it
     * @param event
     */
    'click .sibling-button':function(event){
        event.preventDefault();
        Meteor.call('adoptChild', currentNode._id, event.target.id);
        $('#relocateModal').closeModal();
        if (callback){
            callback();
        }
    },
    /**
     * Click the cancel button
     */
    'click #cancel':function(){
        $('#relocateModal').closeModal();
    },
    /**
     * Click the button to have the node adopted by its parent
     */
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
    if (!$('#relocateModal').length) {
        console.log('adding');
        Blaze.render(Template.relocateModal, parentNode);
    }
};

export { addToTemplate, displayModal }