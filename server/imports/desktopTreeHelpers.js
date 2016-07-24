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
            contents: item.name,
            children: []
        };

        temp.children = getDesktopChildren(item._id);
        data.push(temp);

        if(item.done) {
            temp.done = true;
        } else {
            temp.done = item.descendants > 0 && item.completeDescendants === item.descendants;
        }
    });
    return data;
};

/* This has to do with the desktop tree visualisation. Removed for now
 it('can generate the structure to be displayed by jqtree', () => {
 let desktopTreeData = Meteor.server.method_handlers['desktopTreeData'];
 let invocation = { userId };

 let data = desktopTreeData.apply(invocation)[0];

 let expected = {
 id: root,
 label: 'root',
 children: [{
 id:l1,
 label:'l1',
 children: [{
 id:l2done,
 label:'l2done',
 children:[]
 },{
 id:l2not,
 label:'l2not',
 children:[]
 }]
 }]
 }

 expect(data).to.eql(expected);

 });*/

export { getDesktopChildren };