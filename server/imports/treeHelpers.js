import { itemCollection } from './dbSetup';
import * as Check from './check';

/**
 * Helper function to find the percentage that a given item is complete
 * @param _id The id of the item to check
 */
let progress = function(_id) {
    let node = itemCollection.findOne(_id);
    if (node) {
        return node.completeDescendants / node.descendants;
    }
    return 0;
};

/**
 * Helper function to bubble up a change in completion to a leaf node
 * <b><i>This method does no authentication, it must be done prior to calling</i></b>
 * @param _id The ID of the child node whose parent must have it's values changed
 * @param change A value indicating how the number of complete nodes changes
 * <ul>
 *  <li>+1 for incomplete -> complete</li>
 *  <li>-1 for complete -> incomplete</li>
 * </ul>
 */
let bubbleComplete = function(_id, change){
    let node = itemCollection.findOne(_id);
    if (node && node.parent){
        itemCollection.update(node.parent, {
            $inc:{
                completeDescendants: change
            }
        });
        bubbleComplete(node.parent, change);
    }
};

/**
 * Removes a child from its ancestors' descendants counters
 * @param _id The id of the child
 * @param complete True if the node removed was complete
 */
let bubbleRemove = function(_id, complete){
    let parent = itemCollection.findOne({children: _id});
    //We need to decrease descendants
    itemCollection.update(parent._id, {
        $inc: {
            descendants: -1
        }
    });

    //If the item was complete, the completeDescendants counter needs to be decreased as well
    itemCollection.update(parent._id, {
        $inc: {
            completeDescendants: -1
        }
    });

    bubbleRemove(parent._id, complete);
};

export { progress, bubbleComplete, bubbleRemove };