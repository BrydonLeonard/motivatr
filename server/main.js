import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { itemCollection } from './imports/dbSetup';
import { completeClass, getVisChildren } from './imports/visTreeHelpers';
import { completeLabel, getDesktopChildren } from './imports/desktopTreeHelpers';
import * as Errors from './imports/errors';
import * as Check from './imports/check';
import { bubbleComplete, bubbleRemove } from './imports/treeHelpers';

Meteor.startup(() => {
  // code to run on server at startup
});


Meteor.methods({
    /**
     * Returns the user's todo data, formatted to be displayed by jqtree
     * Returns an array of objects, formatted as:
     *   data{
     *      id
     *      parent
     *      name
     *   }
     *   classes
     */
    visTreeData: function(callback){
        if (Meteor.userId) {
            let data = [];

            //All top-level items for the logged in user
            //TODO: this should be synchronous. Just make sure
            itemCollection.find({level: 0, user: Meteor.userId}).forEach(function (item) {
                data.push({
                    data: {
                        id: item._id,
                        parent: null,
                        name: item.name
                    },
                    classes: completeClass(item._id) + 'root'
                });

                for (let child of getVisChildren(item._id, item.name)) {
                    data.push(child);
                }
            });

            //To hold the edges for the jqtree graph
            let edges = [];
            let edgeCount = 0;

            for (var item of data) {
                if (item.data.parent != null) {
                    edges.push({
                        data: {
                            id: 'edgeId' + String(edgeCount++),
                            target: item.data.id,
                            source: item.data.parent
                        }
                    });
                }
            }

            //Add the edges to the array to be sent back to the client
            data = data.concat(edges);

            callback(data);
        } else {
            Errors.noLoginError();
        }
    },
    /**
     * Returns the user's todo data, formatted to be display in the desktop view
     * Returns an array of objects formatted as:
     *   {
     *      id
     *      label
     *      children:[]
     *   }
     */
    desktopTreeData: function(callback){
        if (Meteor.userId){
            let data = [];
            itemCollection.find({level:0, user:Meteor.userId}).forEach(function(item){
                let temp = {
                    id: item._id,
                    label: (item.name + completeLabel(item._id)),
                    children: []
                }

                temp.children = getDesktopChildren(item._id);
                data.push(temp);
            });

            callback(data);
        } else {
            Errors.noLoginError();
        }
    },
    /**
     * Adds a child node to the given parent
     * @param parentId The parent ID
     * @param childName The child node's name
     */
    addChild: function(parentId, childName){
        if (Meteor.userId){
            check(parentId, String);
            check(childName, String);

            //Allows this method to create root nodes as well
            //Checks permissions while acquiring the node
            let parent = parentId ? Check.nodePermissions(parentId) : null;

            let _id = (new Meteor.Collection.ObjectID())._str;
            let level = parent ? parent.level + 1 : 0;

            //Add the child to the db
            itemCollection.insert({
                _id,
                level,
                children: [],
                descendants: 0,
                completeDescendants: 0,
                name,
                done: false,
                parent: parentId,
                user: Meteor.userId
            });

            //Update the parent with the new child
            itemCollection.update({
                _id:parentId
            }, {
                $push: {
                    children: _id
                },
                $inc: {
                    descendants: 1
                }
            });
        } else {
            Errors.noLoginError();
        }
    },
    /**
     * Toggles an item between complete and incomplete.
     * The node must be a leaf node for this to work correctly
     * @param _id
     */
    toggleComplete: function(_id){
        if (Meteor.userId) {
            check(_id, String);

            let node = Check.nodeExists(_id);
            node = Check.nodePermissions(_id, node);

            if (node.descendants > 0){
                throw new Meteor.Error('not-leaf-node', 'You can only mark a leaf node as complete');
            }

            itemCollection.update(_id, {
                $set: {
                    done: !node.done
                }
            });
            bubbleComplete(node._id, node.done);
        } else {
            Errors.noLoginError();
        }
    },
    /**
     * Remove
     * @param _id
     */
    removeNode: function(_id){
        if (Meteor.userId){
            check(_id, String);

            let node = Check.nodeExists(_id);
            node = Check.nodePermissions(_id, node);

            itemCollection.remove(node._id);
            if (node.parent){
                bubbleRemove(node._id, node.done);
                itemCollection.update(node.parent, {
                    $pull:{
                        children: node._id
                    }
                });
            }
        }
    }
});





