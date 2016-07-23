import './newItemModal.html';

//TODO consider letting users add a description to their tasks
//Make an input on the newItemModal to allow for this
//TODO datepicker required isn't working

//callback for after displayModal is run
let data;

//For when the checkbox changes
let checkBoxDep = new Tracker.Dependency;

/**
 * Add event handlers
 */
Template.newItemModal.events({
    /**
     * Form submit.
     * @param event
     */
    'submit #newItemForm': function (event) {
        event.preventDefault();
        if (!$(event.currentTarget.itemName).hasClass('invalid')) {
            let newObj = {};
            /* Commented out until we actually find a use for this stuff
             let date;
             if ($('#hasDate')[0].checked) {
             if ($('#dateLimit').val() != '') {
             newObj.date = $('#dateLimit').val();
             } else {
             date = null;
             }
             } else {
             date = null;
             }

             if ($('#hasPriority')[0].checked) {
             newObj.priority = Number($('#priority').val());
             }

             if ($('#hasIterable')[0].checked) {
             newObj.repeatable = true;
             if ($('#hasIterableLimit')[0].checked) {
             newObj.repeatableLimit = Number($('#iterableLimit').val());
             }
             }
             */

            newObj.parentId = data.parent;

            /*if ($('#hasDuplicates')[0].checked) {
             newObj.duplicates = $('#duplicates').val();
             }*/

            if ($('#importTree')[0].checked) {
                let treeString = event.target.treeString.value;
                console.log(treeString);
                Meteor.call('importTree', treeString, data.parent, function(e){
                    console.log(e);
                    if (e){
                        Materialize.toast("Tree couldn't be built", 4000);
                    } else {
                        Materialize.toast('Tree added', 4000);
                    }
                });
            } else {
                newObj.name = event.target.itemName.value;
                Meteor.call('addChild', newObj, function (e) {
                    if (data.callback) {
                        data.callback(e);
                        Materialize.toast('Item added', 4000);
                    }
                });
            }
            $('#newItemModal').closeModal();
        }
    },
    /**
     * Triggers the checkBoxDep to update the datepicker
     */
    'change #hasDate':function(){
        checkBoxDep.changed();
    },
    'change #hasPriority':function(){
        checkBoxDep.changed();
    },
    'change #hasDuplicates':function(){
        checkBoxDep.changed();
    },
    'change #hasIterable':function(){
        checkBoxDep.changed();
    },
    'change #hasIterableLimit':function(){
        checkBoxDep.changed();
    },
    'change #importTree':function(){
        checkBoxDep.changed();
    },
    'click #newItemCancel': function() {
        $('#newItemModal').closeModal();
    }
});

/**
 * Helpers
 */
Template.newItemModal.helpers({
    'hasDateLimit': function(){
        checkBoxDep.depend();
        //The helper tries to run when the modal is first added to the dom
        let value = $('#hasDate')[0] ? $('#hasDate')[0].checked : false;
        if (value) {
            //Need to initialise the datepicker after dom is updated
            Tracker.afterFlush(function () {
                $('.datepicker').pickadate({
                    container: 'body', //To fix datepicker in modal bug
                    selectMonths: true,
                    selectYears: 10
                });
            });
        }
        return value;
    },
    hasPriority: function(){
        checkBoxDep.depend();
        let value = $('#hasPriority')[0] ? $('#hasPriority')[0].checked : false;
        return value;
    },
    hasDuplicates:function(){
        checkBoxDep.depend();
        let value = $('#hasDuplicates')[0] ? $('#hasDuplicates')[0].checked : false;
        return value;
    },
    hasIterable:function(){
        checkBoxDep.depend();
        let value = $('#hasIterable')[0] ? $('#hasIterable')[0].checked : false;
        return value;
    },
    hasIterableLimit:function(){
        checkBoxDep.depend();
        let value = $('#hasIterableLimit')[0] ? $('#hasIterableLimit')[0].checked : false;
        return value;
    },
    importTree:function(){
        checkBoxDep.depend();
        let value = $('#importTree')[0] ? $('#importTree')[0].checked : false;
        return value;
    },
    options: function(){
        return [
            { value:1, colour: 'blue', text: 'Low priority'},
            { value:2, colour: 'green', text: 'Medium priority'},
            { value:3, colour: 'red', text: 'High priority'}
        ]
    },
    'nameLength':function(){
        return Meteor.settings.public.maxNameLength;
    },
    'initCounter':function(){
        //Character counter needs to be initialized
        Tracker.afterFlush(function() {
            $('#newItemInput > .character-counter').remove();
            $('#itemName').characterCounter();
        });
    }
});

/**
 * Opens the add new item modal
 * The new item will be a child of the node with the provided ID
 * New child will be added by the modal's internal methods
 * @param parent The parent of the new node
 * @param callback A callback to be called after the modal is complete. No parameters
 */
let displayModal = function(parent, callback){
    $('#newItemModal').openModal();

    $('#hasDate').attr('checked', false);
    checkBoxDep.changed();
    $('#itemName').val('');
    $('#itemName').focus();
    data = {
        parent,
        callback
    };
};

/**
 * Adds the modal to the current template
 * Remember to do this before trying to use the modal
 * @param parentNode The parent node. Can be anything on the relevant template
 */
let addToTemplate = function(parentNode){
    if (!$('newItemModal').length) {
        Blaze.render(Template.newItemModal, parentNode);
    }
};


export { displayModal, addToTemplate };