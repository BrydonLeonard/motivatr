import { Materialize } from 'meteor/materialize:materialize';

/**
 * The user was not found in the database
 */
let noSuchUser = function(){
    Materialize.toast('User not found');
};

/**
 * The password does not match the given user
 */
let invalidPass = function(){
    Materialize.toast('Invalid password');
};

/**
 * The login failed for an unknown reason
 */
let unknownError = function(){
    Materialize.toast('Something went wrong');
};

export { noSuchUser, invalidPass, unknownError };