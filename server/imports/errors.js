/**
 * For when the user is not currently logged in
 */
let noLoginError = function(){
    throw new Meteor.Error('no-login', 'You must be logged in to access this feature');
};

/**
 * For when the user does not have required access permissions
 */
let accessPermError = function(){
    throw new Meteor.Error('access-permission', 'You do not have permission to access this item');
};

/**
 * For when the node that a user attempts to access does not exist
 */
let nodeNotFoundError = function(){
    throw new Meteor.Error('node-not-found', 'The node that was attempted to be accessed does not exist');
};

export { noLoginError, accessPermError, nodeNotFoundError }
