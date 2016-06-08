import { itemCollection } from './dbSetup';
import { addLeaf, bubbleAdd } from './treeHelpers';

/**
 * Serializes a tree.
 * Only keeps the tree structure data, nothing relating to completion
 * @param rootId
 */
let serializeTree = function(rootId){
    return JSON.stringify(serializableTree(rootId));
};

let serializableTree = function(rootId){
    let root = itemCollection.findOne(rootId);

    let tree = {
        n:root.name,
        c: []
    };

    for (let child of root.children){
        //If I don't do this it tries to escape the slashes being used for escaping
        tree.c.push(serializableTree(child));
    }
    return tree;
};

/**
 * Takes a serialized tree, deserializes it and adds it under the given node.
 * Will make a new root node if no parent is given
 * @param treeString The serialized tree
 * @param parent The parent
 * @param user User ID to add tree to
 */
let deserializeTree = function(treeString, parent, user){
    try {
        let tree = JSON.parse(treeString);

        let level = 0;

        if (parent != null) {
            let parentNode = itemCollection.findOne(parent);
            level = parentNode.level + 1;
        }

        let rootObject = {
            name: tree.n,
            completeDescendants: 0,
            descendants: 0,
            children: [],
            done: false,
            level,
            parent: parent,
            priority: 0,
            user
        };

        let rootId = addLeaf(rootObject);
        bubbleAdd(rootId);

        tree.c.forEach((child) => addToTree(child, level + 1, rootId, user));
    } catch (e){
        throw new Meteor.Error('parse-fail', "Couldn't parse tree");
    }
};


/**
 * An internal method for deserializeTree
 * Adds the given tree to the parent with the given ID.
 * Level is taken as a parameter to improve performance
 * @param tree The tree structure
 * @param level The level of the tree
 * @param parent The parent of the tree
 * @param user The owner of theroot
 */
let addToTree = function(tree, level, parent, user){
    let object = {
        name:tree.n,
        completeDescendants:0,
        descendants:0,
        children:[],
        done: false,
        level,
        parent:parent,
        priority:0,
        user
    };

    let newId = addLeaf(object);
    bubbleAdd(newId);

    tree.c.forEach((child) => addToTree(child, level + 1, newId, user));
};

export { serializeTree, deserializeTree }