import './confirmModal.html';

let data;

let textDep = new Tracker.Dependency;

Template.confirmModal.helpers({
    /**
     * The body text to display
     * @returns {text}
     */
    'text':function(){
        textDep.depend();
        if (data) {
            return data.text;
        }
    }
});

Template.confirmModal.events({
    /**
     * Callback with positive result
     * @param event
     */
    'click #confirm': function(event){
        event.preventDefault();
        data.callback(true);
        $('#confirmModal').closeModal();
    },
    /**
     * Callback with negative result
     * @param event
     */
    'click #cancel': function(event){
        event.preventDefault();
        data.callback(false);
        $('#confirmModal').closeModal();
    }
});

/**
 * Open a confirmation modal
 * @param callback A function to be called with the confirmation or cancellation from the modal
 */
let displayModal = function(text, callback){
    data = {
        text,
        callback
    };
    textDep.changed();
    $('#confirmModal').openModal();
};

/**
 * Adds the modal to the current template
 * Remember to do this before trying to use the modal
 * @param parentNode The parent node. Can be anything on the relevant template
 */
let addToTemplate = function(parentNode){
    Blaze.render(Template.confirmModal, parentNode);
};

export { displayModal, addToTemplate };