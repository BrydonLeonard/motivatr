import { itemCollection } from './dbSetup';
import * as Check from './check';

/**
 * Helper function to find the percentage that a given item is complete
 * Will return 1 or 0 for a leaf node
 * @param _id The id of the item to check
 */
let progress = function(_id) {
    let node = itemCollection.findOne(_id);
    if (node) {
        if (node.descendants > 0) {
            return node.completeDescendants / node.descendants;
        } else if (node.done){
            return 1;
        }
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

        // If the parent was complete, this increases the number of lost completeDescendants
        if ((parent.completeDescendants - change) == parent.descendants){
            change += (change / Math.abs(change));
        }

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
 * Physically removes all descendants of a given node, but not the node itself
 * Does not bubble changes from removing the nodes
 * Call bubbleAdd and then bubbleRemove on the parent node to complete a removal
 * <b>Must</b> be called before the node is removed from the tree
 * @param _id The id of the ancestor node whose descendants should be removed
 */
let sinkRemove = function(_id){
    let thisNode = itemCollection.findOne(_id);

    for (let childId of thisNode.children) {
        let child = itemCollection.findOne(childId);
        sinkRemove(childId);
        itemCollection.remove(childId);
    }
    itemCollection.update(_id, {
        $set: {
            children: []
        }
    });
}

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
 * Bubbles a change in the number of nodes down a branch of a tree
 * @param _id The child of the node to be updated
 * @param nodeChange The change in the number of nodes
 * @param completeNodeChange The change in the number of complete nodes
 */
let bubbleUpdate = function(_id, nodeChange, completeNodeChange){
    let parent = itemCollection.findOne({children: _id});

    if (parent){
        itemCollection.update(parent._id, {
            $inc: {
                descendants: nodeChange,
                completeDescendants: completeNodeChange
            }
        });

        bubbleUpdate(parent._id, nodeChange, completeNodeChange);
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
 * <b>If you screw up the object you send to this method it is going to be added to the database anyway</b>
 * newObj:{
 *  parent,
 *  name,
 *  user,
 *  date,
 *  priority,
 *  repeatable,
 *  repeatableLimit
 * } are the valid fields
 * @returns {String} The id of the new node
 */
let addLeaf = function(newObj) {
    //Allows this method to create root nodes as well
    //Checks permissions while acquiring the node

    let parent = newObj.parent ? itemCollection.findOne(newObj.parent) : null;

    let level = parent ? parent.level + 1 : 0;

    newObj.level = level;
    newObj.children = [];
    if (newObj.repeatable) {
        if (!newObj.repeatableLimit) {
            newObj.done = true;
        } else {
            newObj.done = false;
        }
        newObj.repeated = 0;
    } else {
        newObj.done = false;
    }
    newObj.descendants = 0;
    newObj.completeDescendants = 0;

    //Add the child to the db
    let _id = itemCollection.insert(newObj);

    //Update the parent with the new child
    itemCollection.update({
        _id:newObj.parent
    }, {
        $push: {
            children: _id
        }
    });
    return _id;
};

export { progress, bubbleComplete, bubbleRemove, sinkRemove, bubbleAdd, bubbleUpdate, addLeaf, removeLeaf };