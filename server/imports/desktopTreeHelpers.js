import { Mongo } from 'meteor/mongo';
import { itemCollection } from './../../shared/imports/dbSetup';
import { progress } from './treeHelpers';


/**
 * A helper function to get all the children of an item, formatted for the desktop view
 * @param _id The ID of the element to check
 * @returns {Array} The array of children
 */
let getDesktopChildren = function(_id){
    let data = [];
    itemCollection.find({parent:_id}).forEach(function(item) {
        let temp = {
            id: item._id,
            contents: (item.name + completeLabel(item._id)),
            children: []
        };
        temp.children = getDesktopChildren(item._id);
        data.push(temp);
    });
    return data;
};

/**
 * A helper to get the text to be displayed after an item to mark completeness in the desktop view
 * @param id The item id
 * @returns {String} The string to be displayed
 */
let completeLabel = function(_id){
    if (progress(_id) == 1){
        return ' [DONE]';
    }
    return '';
};

export { completeLabel, getDesktopChildren };