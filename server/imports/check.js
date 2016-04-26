import { Meteor } from 'meteor/meteor';
import * as Errors from './errors';
import { itemCollection } from './dbSetup';

/**
 * Find the node with given ID and checks that the current user has access permission
 * <ul>
 *     <li>User must be logged in</li>
 *     <li>The node must exist</li>
 * </ul>
 * @param _id The ID of the node</br>
 * @param node (optional) The node object
 * @returns The node that was checked
 */
let nodePermissions = function(_id, node){
    node = node || itemCollection.findOne(_id);

    //Extra check to ensure that the node's id is the same as the given id, if the calling method provides both
    if (node._id == _id && node.user != Meteor.userId){
        Errors.accessPermError();
    }

    return node;
};


let nodeExists = function(_id){
    let node = itemCollection.findOne(_id);

    if (node.user != Meteor.userId){
        Errors.nodeNotFoundError();
    }

    return node;
};

export { nodePermissions, nodeExists };