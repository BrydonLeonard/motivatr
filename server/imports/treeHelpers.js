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
            $inc: {
                completeDescendants: change
            }
        });
        let parent = itemCollection.findOne(node.parent);

        // If the parent has become completed, this adds 1 to the number of completed nodes
        if ((parent.completeDescendants) === parent.descendants){
            change += (change / Math.abs(change));
        }
        bubbleComplete(node.parent, change);
    }
};

/**
 * Helper function to bubble changes after a node is removed
 * <b>Must</b> be called before the node is removed from the database
 * @param _id The id of the child
 * @param complete True if the node removed was complete
 */
let bubbleRemove = function(_id, complete){
    let parent = itemCollection.findOne({ children: _id });

    if (parent){
        // We need to decrease descendants
        itemCollection.update(parent._id, {
            $inc: {
                descendants: -1
            }
        });

        parent.descendants--;

        //If the item was complete, the completeDescendants counter needs to be decreased as well
        if (complete) {
            itemCollection.update(parent._id, {
                $inc: {
                    completeDescendants: -1
                }
            });
            parent.completeDescendants--;
        }

        //If a node has become complete, this needs to be bubbled upwards
        if ((parent.completeDescendants == parent.descendants) && (parent.descendants != 0)){
            bubbleComplete(parent._id, 1);
        }

        bubbleRemove(parent._id, complete);
    }
};

/**
 * Helper function to update descendant counters, after a child is added
 * @param _id The id of the child
 */
let bubbleAdd = function(_id) {
    let parent = itemCollection.findOne({children: _id});

    if (parent){
        itemCollection.update(parent._id, {
            $inc: {
                descendants: 1
            }
        });
        bubbleAdd(parent._id);
    }
};

/**
 * Removes a node and the references from it's parent
 * Does <b>not</b> bubble the changes
 * @param _id The ID of the node to be removed
 */
let removeLeaf = function(_id){
    itemCollection.remove(_id);

    itemCollection.update({children:_id},{
        $pull:{
            children: _id
        }
    });
};


/**
 * Adds a leaf node as a child of the given parent, or as a root if parentId is null.
 * Does <b>not</b> bubble the changes
 * @param parentId The ID of the parent of the new node, or null to add a root node
 * @param name The name of the new node
 * @param user The user that owns the node
 * @returns {String} The id of the new node
 */
let addLeaf = function(parentId, name, user){
    //Allows this method to create root nodes as well
    //Checks permissions while acquiring the node
    let parent = parentId ? itemCollection.findOne(parentId) : null;

    let level = parent ? parent.level + 1 : 0;

    //Add the child to the db
    let _id = itemCollection.insert({
        level,
        children: [],
        descendants: 0,
        completeDescendants: 0,
        name,
        done: false,
        parent: parentId,
        user
    });

    //Update the parent with the new child
    itemCollection.update({
        _id:parentId
    }, {
        $push: {
            children: _id
        }
    });
    return _id;
};
export { progress, bubbleComplete, bubbleRemove, bubbleAdd, addLeaf, removeLeaf };