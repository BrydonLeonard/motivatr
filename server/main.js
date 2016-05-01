import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { itemCollection } from './imports/dbSetup';
import { completeClass, getVisChildren } from './imports/visTreeHelpers';
import { completeLabel, getDesktopChildren } from './imports/desktopTreeHelpers';
import * as Errors from './imports/errors';
import * as Check from './imports/check';
import { bubbleComplete, bubbleRemove, bubbleAdd, addLeaf, removeLeaf } from './imports/treeHelpers';

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
    visTreeData: function(){
        let userId = this.userId;
        if (userId){
            let data = [];

            //All top-level items for the logged in user
            //TODO: this should be synchronous. Just make sure
            itemCollection.find({level: 0, user: userId}).forEach(function (item) {
                data.push({
                    data: {
                        id: item._id,
                        name: item.name
                    },
                    scratch: {
                        parent: null,
                    },
                    classes: completeClass(item._id) + 'root'
                });

                for (let child of getVisChildren(item._id)) {
                    data.push(child);
                }
            });

            //To hold the edges for the jqtree graph
            let edges = [];
            let edgeCount = 0;

            for (var item of data) {
                if (item.scratch.parent != null) {
                    edges.push({
                        data: {
                            id: 'edgeId' + String(edgeCount++),
                            target: item.data.id,
                            source: item.scratch.parent
                        }
                    });
                }
            }

            //Add the edges to the array to be sent back to the client
            data = data.concat(edges);

            return data
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
    desktopTreeData: function(){
        let userId = this.userId;
        if (userId){
            let data = [];
            itemCollection.find({level:0, user:userId}).forEach(function(item){
                let temp = {
                    id: item._id,
                    label: (item.name + completeLabel(item._id)),
                    children: []
                }

                temp.children = getDesktopChildren(item._id);
                data.push(temp);
            });

            return data;
        } else {
            Errors.noLoginError();
        }
    },
    /**
     * Adds a child node to the given parent
     * @param parentId The parent ID
     * @param name The child node's name
     * @return The new id
     */
    addChild: function(parentId, name){
        let userId = this.userId;

        let _id;

        if (userId){
            check(parentId, Match.OneOf(String, null));
            check(name, String);

            if (parentId != null) {
                Check.nodePermissions(userId, parentId);
            }

            let parent = itemCollection.findOne(parentId);
            if (parent && parent.done){
                itemCollection.update(parentId, {
                    $set: {
                        done: false
                    }
                });
                bubbleComplete(parentId, -1);
            }

            _id = addLeaf(parentId, name, userId);
            bubbleAdd(_id);
        } else {
            Errors.noLoginError();
        }

        return _id;
    },
    /**
     * Toggles an item between complete and incomplete.
     * The node must be a leaf node for this to work correctly
     * @param _id
     */
    toggleComplete: function(_id){
        let userId = this.userId;
        if (userId){
            check(_id, String);

            let node = Check.nodeExists(userId, _id);
            node = Check.nodePermissions(userId, _id, node);

            if (node.descendants > 0){
                throw new Meteor.Error('not-leaf-node', 'You can only mark a leaf node as complete');
            }

            itemCollection.update(_id, {
                $set: {
                    done: !node.done
                }
            });
            bubbleComplete(node._id, node.done ? -1 : 1);
        } else {
            Errors.noLoginError();
        }
    },
    /**
     * Remove
     * @param _id
     */
    removeNode: function(_id){
        let userId = this.userId;
        if (userId){
            check(_id, String);

            let node = Check.nodeExists(userId, _id);
            node = Check.nodePermissions(userId, _id, node);

            //Remove from db
            bubbleRemove(node._id, node.done);
            itemCollection.remove(node._id);

            itemCollection.update(node.parent, {
                $pull:{
                    children: node._id
                }
            });
        }
    }
});

Meteor.publish('itemCollection', function(){
    return itemCollection.find({user:this.userId});
});




