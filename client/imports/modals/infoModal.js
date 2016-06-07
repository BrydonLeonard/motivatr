import './infoModal.html';

let data;

let textDep = new Tracker.Dependency;

Template.infoModal.helpers({
    'text':function(){
        textDep.depend();
        if (data) {
            return data.text;
        }
    },
    'heading':function(){
        textDep.depend();
        if (data) {
            return data.heading;
        }
    }
});

Template.infoModal.events({
    'click #ok':function(event){
        event.preventDefault();
        $('#infoModal').closeModal();
    }
})


/**
 * Open an info modal
 * @param text Text to be displayed in the body
 * @param heading Heading of the modal
 * @param callback A function to be called after the modal is closed
 */
let displayModal = function(text, heading, callback){
    data = {
        text,
        heading,
        callback
    };
    textDep.changed();
    $('#infoModal').openModal();
};

/**
 * Adds the modal to the current template
 * Remember to do this before trying to use the modal
 * @param parentNode The parent node. Can be anything on the relevant template
 */
let addToTemplate = function(parentNode){
    Blaze.render(Template.infoModal, parentNode);
};

export { displayModal, addToTemplate };