import './editModal.html';
import * as relocateModal from './relocateModal.js';
import { itemCollection } from '../../../shared/imports/dbSetup';

let currentNodeId = null;
let parentId = null;
let relocateNode = null;
let currentNodeName = null;

//These 2 work together to determine whether the move button is displayed
let relocateDep = new Tracker.Dependency;
let canRelocate;

Template.editModal.helpers({
    //The max length of a node's name
    'nameLength':function(){
        return Meteor.settings.public.maxNameLength;
    },
    //Whether we display the move button
    'canRelocate':function(){
        relocateDep.depend();
        return canRelocate;
    }
});

Template.editModal.events({
    /**
     * Submit the form, changing the name of the node
     * @param event
     */
    'submit #editForm':function(event){
        event.preventDefault();
        console.log('submitting');
        Meteor.call('rename', currentNodeId, $(event.target.editItemName).val(),  function(){
           $('#editModal').closeModal();
        });
    },
    /**
     * Click the button to open the relocate modal
     * @param event
     */
    'click #relocate':function(event){
        event.preventDefault();
        relocateNode();

        $('#editModal').closeModal();
    },
    /**
     * Click the cancel button
     * @param event
     */
    'click #cancel':function(event){
        event.preventDefault();
        $('#editModal').closeModal();
    }
});

/**
 * Open an edit modal
 * @param text Text to be displayed in the body
 */
let displayModal = function(nodeId, parent){
    currentNodeId = nodeId;

    currentNodeName = itemCollection.findOne(currentNodeId).name;

    $('#editItemName').val(currentNodeName);
    Tracker.afterFlush(function(){
        Materialize.updateTextFields();
        $('#editItemName').focus();
    });

    parentId = parent;

    //The node that we'll be moving if we relocate
    let thisItem = itemCollection.findOne(nodeId);
    let currentNode = {
        name: thisItem.name,
        _id: thisItem._id
    };

    //The parent of the node we'll be moving
    let activeItem = itemCollection.findOne(parentId);

    //Actually refers to the grandparent of the node we're moving
    let parentNode = null;

    //If we aren't at the root
    if (activeItem != null) {
        parentNode = {
            name: activeItem.name,
            _id: activeItem._id,
            grandparent: activeItem.parent //This is where we would move the node if it moved to its grandparent
        };
    } else {
        //If we're already at the root, then send a null _id
        parentNode = {
            _id: null,
            grandparent: null
        }
    }

    //Siblings of the node we're moving. Children of the active node
    let siblingNodes = [];
    if (activeItem != null){
        for (let child of activeItem.children){
            let childItem = itemCollection.findOne(child);
            siblingNodes.push({
                name: childItem.name,
                _id: childItem._id
            });
        }
    } else { // For when we're at the root
        itemCollection.find({level: 0}).forEach(function(item){
            siblingNodes.push({
                name: item.name,
                _id: item._id
            });
        });
    }


    //Check whether we should be displaying the relocate button
    //We do so if we have more than 1 node on this level or have a parent
    canRelocate = true;
    if (siblingNodes.length === 1 && !parentNode._id){
        canRelocate = false;
    } else {
        //Set up the function to be called by the relocate button
        relocateNode = function(){
            relocateModal.displayModal({ currentNode, parentNode, siblingNodes});
        };
    }
    relocateDep.changed();


    $('#editModal').openModal();
};

/**
 * Adds the modal to the current template
 * Remember to do this before trying to use the modal
 * @param parentNode The parent node. Can be anything on the relevant template
 */
let addToTemplate = function(parentNode){
    if (!$('#editModal').length) {
        Blaze.render(Template.editModal, parentNode);
        Tracker.afterFlush(function () {
            //Display the character counter
            $('#editItemInput > .character-counter').remove();
            $('#editItemName').characterCounter();
        });
    }
};

export { displayModal, addToTemplate };