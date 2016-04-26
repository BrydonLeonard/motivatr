import { Mongo } from 'meteor/mongo';
import { progress } from './treeHelpers';
import { itemCollection } from './dbSetup';

/**
 * Helper function to get the class of an item in the jqtree display, based on item progress
 * @param id The item ID
 * @returns {String} The class string
 */
let completeClass = function(id){
    if (progress(id) == 1){
        return 'complete ';
    }
    return '';
};

/**
 * Helper function to recursively fetch the children of an element
 * @param _id The ID of the element whose children we should check
 * @param parentName The id of the parent, for up-linking the children
 * @returns {Array} An array of children
 */
let getVisChildren = function(_id, name){
    let arr = [];
    itemCollection.find({parent:_id}).forEach(function(item) {
        arr.push({
            data: {id: item.name, parent: name},
            classes: completeClass(item._id)
        });
        arr = arr.concat(getVisChildren(item._id, item.name));
    });
    return arr;
};

export { completeClass, getVisChildren };