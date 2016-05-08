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

        let date;
        if ($('#hasDate')[0].checked){
            if ($('#dateLimit').val() != ''){
                date = $('#dateLimit').val();
            } else {
                date = null;
            }
        } else {
            date = null;
        }

        let priority = 0;
       if ($('#hasPriority')[0].checked){
            priority = $('#priorityLevel').val();
        }

        Meteor.call('addChild', data.parent, event.target.itemName.value, date, priority, function(e){
            if (data.callback) {
                data.callback(e);
                $('#newItemModal').closeModal();
            }
        });

    },
    /**
     * Triggers the checkBoxDep to update the datepicker
     */
    'change #hasDate':function(){
        checkBoxDep.changed();
    },
    'change #hasPriority':function(){
        checkBoxDep.changed();
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
        if (value){
            Tracker.afterFlush(function(){
                $('select').material_select();
            });
        }
        return value;
    },
    options: function(){
        return [
            { value:1, colour: 'blue', text: 'Low priority'},
            { value:2, colour: 'green', text: 'Medium priority'},
            { value:3, colour: 'red', text: 'High priority'}
        ]
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
    $('#hasPriority').attr('checked', false);
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
    Blaze.render(Template.newItemModal, parentNode);
};


export { displayModal, addToTemplate };