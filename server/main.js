import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { itemCollection } from './imports/dbSetup';
import { completeClass, getVisChildren } from './imports/visTreeHelpers';
import { completeLabel, getDesktopChildren } from './imports/desktopTreeHelpers';
import * as Errors from './imports/errors';
import * as Check from './imports/check';
import { bubbleComplete, bubbleRemove, sinkRemove,  bubbleAdd, bubbleUpdate, addLeaf, removeLeaf, bubbleLevel } from './imports/treeHelpers';
import { initServices } from './imports/services';
import moment from 'moment';

Meteor.startup(() => {
    initServices();
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
     * props {
     *  parentId,
     *  name,
     *  priority,
     *  date,
     *  repeatable,
     *  repeatableLimit,
     *  duplicates
     * }
     * @return The new id, if only 1 element was added
     */
    addChild: function(props){
        let duplicates = 1;
        if (props.duplicates){
            duplicates = Number(props.duplicates);
        }

        for (let i = 0; i < duplicates; i++) {
            let userId = this.userId;
            let _id;
            if (userId) {
                let newObj = {};

                //Check parentId
                if (props.parentId) {
                    check(props.parentId, String);
                    newObj.parent = props.parentId;
                } else {
                    newObj.parent = null;
                }

                //Check name
                check(props.name, String);
                newObj.name = props.name + (duplicates > 1 ? ' (' + (i+1) + ')' : '');

                //Check priority
                if (props.priority) {
                    check(props.priority, Number);
                    check((props.priority >= 0 && props.priority < 6), true);
                    newObj.priority = props.priority;
                } else {
                    newObj.priority = 0;
                }

                //Check date
                let formattedDate = null;
                if (props.date) {
                    formattedDate = moment(props.date, 'DD MMMM, YYYY')
                }

                if (props.date && formattedDate != null) {
                    check(formattedDate.isValid(), true);
                    newObj.date = formattedDate.toDate();
                }

                if (props.repeatable) {
                    check(props.repeatable, Boolean);
                    newObj.repeatable = props.repeatable;

                    if (props.repeatableLimit) {
                        check(props.repeatableLimit, Number);
                        newObj.repeatableLimit = props.repeatableLimit;
                    }
                }

                //Check access permissions
                if (props.parentId != null) {
                    Check.nodePermissions(userId, props.parentId);
                }
                newObj.user = userId;

                let parent = itemCollection.findOne(props.parentId);
                if (parent && parent.done) {
                    itemCollection.update(props.parentId, {
                        $set: {
                            done: false
                        }
                    });
                    bubbleComplete(props.parentId, -1);
                }

                _id = addLeaf(newObj);
                bubbleAdd(_id);

                if (props.repeatable && !props.repeatableLimit){
                    bubbleComplete(_id, 1);
                }


                if (duplicates === 1){
                    return _id;
                }
            } else {
                Errors.noLoginError();
            }
        }
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
     * Increments the reps on a repeatable object
     * Will only work if reps < repeatableLimit or there is no repeatableLimit
     * @param _id ID of the item to increment
     */
    increaseReps: function(_id){
        let userId = this.userId;
        if (userId){
            check(_id, String);

            let node = Check.nodeExists(userId, _id);
            node = Check.nodePermissions(userId, _id, node);

            if (!node.repeatable){
                throw new Meteor.Error('not-repeatable', 'This node is not repeatable');
            }

            if (node.repeatableLimit && node.repeated >= node.repeatableLimit){
                throw new Meteor.Error('repeats-max', 'Cannot increment this node any more');
            }
            itemCollection.update(_id, {
                $inc: {
                    repeated: 1
                }
            });
            if (node.repeatableLimit){
                if ((node.repeated + 1) === node.repeatableLimit){
                    bubbleComplete(_id, 1);
                    itemCollection.update(_id, {
                        $set: {
                            done: true
                        }
                    });
                }
            }
        } else {
            Errors.noLoginError();
        }
    },
    /**
     * Decrements the reps on a repeatable object
     * Will only work if reps > 1
     * @param _id ID of the item to decrement
     */
    decreaseReps: function(_id){
        let userId = this.userId;
        if (userId){
            check(_id, String);

            let node = Check.nodeExists(userId, _id);
            node = Check.nodePermissions(userId, _id, node);

            if (!node.repeatable){
                throw new Meteor.Error('not-repeatable', 'This node is not repeatable');
            }

            if (node.repeated <= 0){
                throw new Meteor.Error('repeats-mix', 'Cannot decrement this node any more');
            }
            itemCollection.update(_id, {
                $inc: {
                    repeated: -1
                }
            });
            if (node.repeatableLimit){
                if (node.repeated === node.repeatableLimit){
                    bubbleComplete(_id, -1);
                    itemCollection.update(_id, {
                        $set: {
                            done: false
                        }
                    });
                }
            }
        } else {
            Errors.noLoginError();
        }
    },
    /**
     * Removes a node
     * If the node has children, will remove them and bubble necessary changes up the tree
     * @param _id
     */
    removeNode: function(_id){
        //TODO add case for removing a root node. Those don't need so much checking
        let userId = this.userId;
        if (userId){
            check(_id, String);

            let node = Check.nodeExists(userId, _id);
            node = Check.nodePermissions(userId, _id, node);

            if (node.descendants === 0) {
                //We are requested to remove a leaf node
                bubbleRemove(node._id, node.done);
                sinkRemove(node._id);
                itemCollection.remove(node._id);

                itemCollection.update(node.parent, {
                    $pull: {
                        children: node._id
                    }
                });
            } else {
                //We are requested to remove an internal node
                //Remove the nodes from the ancestor's counters
                let completeUpdate = 0;
                if (node.descendants > 0){
                    completeUpdate -= node.completeDescendants;
                    if (node.descendants === node.completeDescendants){
                        completeUpdate -= 1;
                    }
                } else {
                    if (node.done){
                        completeUpdate -= 1;
                    }
                }
                bubbleUpdate(node._id, -node.descendants - 1, completeUpdate);
                //Physically remove child nodes
                sinkRemove(node._id);
                //Add the node back to fix the tree
                bubbleAdd(node._id);
                //Remove the node from the tree
                bubbleRemove(node._id);
                //Phyiscally remove the node from the db
                itemCollection.remove(node._id);

                itemCollection.update(node.parent, {
                    $pull: {
                        children: node._id
                    }
                })
            }
        }
    },
    /**
     * Removes the children of a given node
     * No changes are bubbled and the children are not removed from their parent's arrays
     * @param _id The id of the node whose children should be removed
     */
    removeChildren: function(_id){
        let userId = this.userId;
        if (userId){
            check(_id, String);

            let node = Check.nodeExists(userId, _id);
            node = Check.nodePermissions(userId, _id, node);

            sinkRemove(_id);
        }
    },
    /**
     * Moves a subtree to be a child of the given node
     * If the parent node is null, the subtree will be made into a new root node
     * @param rootId The id of the root of the subtree to be moved
     * @param parentId The id of the new parent of the root of the subtree
     */
    //TODO: Tests for adoptChild
    adoptChild: function(rootId, parentId){
        let userId = this.userId;
        if (userId){
            check(rootId, String);

            let parent = null;

            if (parentId != null){
                parent = Check.nodeExists(userId, parentId);
                parent = Check.nodePermissions(userId, parentId, parent);
            }

            let node = Check.nodeExists(userId, rootId);
            node = Check.nodePermissions(userId, rootId, node);

            if (node.parent === null && parentId === null){
                throw new Meteor.Error('is-root', 'This node is a root node');
            }

            //We need to update the ancestors of the node we're about to move
            let completeUpdate = 0;
            if (node.descendants > 0){
                completeUpdate -= node.completeDescendants;
                if (node.descendants === node.completeDescendants){
                    completeUpdate -= 1;
                }
            } else {
                if (node.done){
                    completeUpdate -= 1;
                }
            }

            bubbleUpdate(node._id, -node.descendants - 1, completeUpdate);

            //The add/remove fix
            //TODO: implement a more efficient way of doing this
            bubbleAdd(node._id);
            bubbleRemove(node._id);

            itemCollection.update(node.parent, {
                $pull: {
                    children: node._id
                }
            });
            //We've finished fixing the old ancestors

            if (parent === null){
                itemCollection.update(node._id, {
                    $set: {
                        parent: null,
                        level: 0
                    }
                });
            } else {
                itemCollection.update(parent._id, {
                    $push: {
                        children: node._id
                    }
                });

                itemCollection.update(node._id, {
                    $set: {
                        parent: parent._id
                    }
                });

                //We can use the counters on the root of the subtree to update the ancestors
                let completeUpdate = 0;
                if (node.descendants > 0){
                    completeUpdate += node.completeDescendants;
                    if (node.descendants === node.completeDescendants){
                        completeUpdate += 1;
                    }
                } else {
                    if (node.done){
                        completeUpdate += 1;
                    }
                }

                if (parent.done){
                    itemCollection.update(parent._id, {
                        $set: {
                            done: false
                        }
                    });
                    bubbleComplete(parent._id, -1);
                }

                bubbleUpdate(node._id, node.descendants + 1, completeUpdate);
                bubbleLevel(parent._id);
            }
        }
    }
});

Meteor.publish('itemCollection', function(){
    return itemCollection.find({user:this.userId});
});




