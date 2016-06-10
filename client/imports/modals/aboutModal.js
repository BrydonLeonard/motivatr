import './aboutModal.html';


Template.aboutModal.events({
    'click #ok':function(event){
        event.preventDefault();
        $('#aboutModal').closeModal();
    }
});

Template.aboutModal.helpers({
    'version':function(){
        return Meteor.settings.public.version;
    }
})

/**
 * Open an about modal
 * This modal is really basic. No params
 */
let displayModal = function(){
    $('#aboutModal').openModal();
};

/**
 * Adds the modal to the current template
 * Remember to do this before trying to use the modal
 * @param parentNode The parent node. Can be anything on the relevant template
 */
let addToTemplate = function(parentNode){
    if(!$('#aboutModal').length) {
        Blaze.render(Template.aboutModal, parentNode);
    }
};

export { displayModal, addToTemplate };