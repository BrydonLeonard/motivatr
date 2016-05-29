import { Meteor } from 'meteor/meteor';
import { expect } from 'meteor/practicalmeteor:chai';
import { itemCollection } from './imports/dbSetup';
import './main';

let resetDB = function(user, noReset){
    //This lets us use this method for testing the adoption methods
    if (!noReset) {
        itemCollection.remove({});
    }

    // Insert framework objects, with only fields necessary for testing
    let root = itemCollection.insert({
        level: 0,
        descendants: 3,
        completeDescendants: 1,
        name: 'root',
        parent: null,
        children: [],
        user
    });

    let l1 = itemCollection.insert({
        level: 1,
        descendants: 2,
        completeDescendants: 1,
        name: 'l1',
        parent: root,
        children: [],
        user
    });

    itemCollection.update(root, {
        $push: {
            children: l1
        }
    });

    let l2done = itemCollection.insert({
        level: 2,
        descendants: 0,
        completeDescendants: 0,
        name: 'l2done',
        done: true,
        parent: l1,
        user,
        children: []
    });

    let l2not = itemCollection.insert({
        level: 2,
        descendants: 0,
        completeDescendants: 0,
        name: 'l2not',
        done: false,
        parent: l1,
        user,
        children: []
    });

    itemCollection.update(l1, {
        $push: {
            children: {
                $each: [l2done, l2not]
            }
        }
    });
    return {
        root,
        l1,
        l2done,
        l2not
    }
};


describe('Meteor Methods', () => {
    describe('Regular nodes', () => {
        let root;
        let l1;
        let l2done;
        let l2not;
        let userId;

        beforeEach(() => {
            userId = '10';
            let vals = resetDB(userId);
            root = vals.root;
            l1 = vals.l1;
            l2done = vals.l2done;
            l2not = vals.l2not;
        });

        it('can add a new leaf node', () => {
            let addChild = Meteor.server.method_handlers['addChild'];
            let invocation = { userId };

            let _id = addChild.apply(invocation, [{
                parentId:l1,
                name:'newNode'
            }]);

            let thisItem = itemCollection.findOne({name: 'newNode'});
            expect(thisItem).to.exist;
            expect(thisItem._id).to.equal(_id);

            expect(thisItem.parent).to.equal(l1);
            expect(thisItem.descendants).to.equal(0);
            expect(thisItem.completeDescendants).to.equal(0);
            expect(thisItem.done).to.equal(false);

            let parent = itemCollection.findOne({children: thisItem._id});
            expect(parent).to.exist;

            expect(parent.descendants).to.equal(3);
            expect(parent.completeDescendants).to.equal(1);
        });

        it('can add a new leaf node to a completed node', () => {
            let addChild = Meteor.server.method_handlers['addChild'];
            let invocation = { userId };

            let _id = addChild.apply(invocation, [{
                parentId: l2done,
                name: 'newNode'
            }]);

            let thisItem = itemCollection.findOne({name: 'newNode'});
            expect(thisItem).to.exist;
            expect(thisItem._id).to.equal(_id);

            expect(thisItem.parent).to.equal(l2done);
            expect(thisItem.descendants).to.equal(0);
            expect(thisItem.completeDescendants).to.equal(0);
            expect(thisItem.done).to.equal(false);

            let parent = itemCollection.findOne({children: thisItem._id});
            expect(parent).to.exist;
            expect(parent.descendants).to.equal(1);
            expect(parent.completeDescendants).to.equal(0);

            let grandParent = itemCollection.findOne(l1);
            expect(grandParent.descendants).to.equal(3);
            expect(grandParent.completeDescendants).to.equal(0);
        });

        it('can add a new root node', () => {
            let addChild = Meteor.server.method_handlers['addChild'];
            let invocation = { userId };

            let _id = addChild.apply(invocation, [{
                name:'newNode'
            }]);

            let thisItem = itemCollection.findOne({name: 'newNode'});
            expect(thisItem).to.exist;
            expect(thisItem._id).to.equal(_id);

            expect(thisItem.parent).to.equal(null);
            expect(thisItem.descendants).to.equal(0);
            expect(thisItem.completeDescendants).to.equal(0);
            expect(thisItem.done).to.equal(false);

            expect(itemCollection.find({children: thisItem._id}).count()).to.equal(0);
        });

        it('can toggle a node (complete -> incomplete)', () => {
            let toggleComplete = Meteor.server.method_handlers['toggleComplete'];
            let invocation = { userId };

            toggleComplete.apply(invocation, [l2done]);

            let thisItem = itemCollection.findOne(l2done);

            expect(thisItem.done).to.equal(false);

            let parent = itemCollection.findOne(l1);

            expect(parent.descendants).to.equal(2);
            expect(parent.completeDescendants).to.equal(0);

            let grandparent = itemCollection.findOne(root);

            expect(grandparent.descendants).to.equal(3);
            expect(grandparent.completeDescendants).to.equal(0);
        });

        it('can toggle a node (incomplete -> complete)', () => {
            let toggleComplete = Meteor.server.method_handlers['toggleComplete'];
            let invocation = { userId };

            toggleComplete.apply(invocation, [l2not]);

            let thisItem = itemCollection.findOne(l2not);

            expect(thisItem.done).to.equal(true);

            let parent = itemCollection.findOne(l1);

            expect(parent.descendants).to.equal(2);
            expect(parent.completeDescendants).to.equal(2);

            let grandparent = itemCollection.findOne(root);

            expect(grandparent.descendants).to.equal(3);
            expect(grandparent.completeDescendants).to.equal(3);
        });

        it('can toggle a node (incomplete -> complete -> incomplete) where the parent follows the same toggle pattern', () => {
            let toggleComplete = Meteor.server.method_handlers['toggleComplete'];
            let invocation = { userId };

            toggleComplete.apply(invocation, [l2not]);
            toggleComplete.apply(invocation, [l2not]);

            let thisItem = itemCollection.findOne(l2not);

            expect(thisItem.done).to.equal(false);

            let parent = itemCollection.findOne(l1);

            expect(parent.descendants).to.equal(2);
            expect(parent.completeDescendants).to.equal(1);

            let grandparent = itemCollection.findOne(root);

            expect(grandparent.descendants).to.equal(3);
            expect(grandparent.completeDescendants).to.equal(1);
        });

        it('can remove an incomplete node', () => {
            let removeNode = Meteor.server.method_handlers['removeNode'];
            let invocation = { userId };

            removeNode.apply(invocation, [l2not]);

            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(parent.descendants).to.equal(1);
            expect(parent.completeDescendants).to.equal(1);

            expect(grandparent.descendants).to.equal(2);
            expect(grandparent.completeDescendants).to.equal(2);
        });

        it('can remove a complete node', () => {
            let removeNode = Meteor.server.method_handlers['removeNode'];
            let invocation = { userId };

            removeNode.apply(invocation, [l2done]);

            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(parent.descendants).to.equal(1);
            expect(parent.completeDescendants).to.equal(0);

            expect(grandparent.descendants).to.equal(2);
            expect(grandparent.completeDescendants).to.equal(0);
        });

        it('can remove the children of a node', () => {
            let removeChildren = Meteor.server.method_handlers['removeChildren'];
            let invocation = { userId };

            removeChildren.apply(invocation, [l1]);

            let thisNode = itemCollection.findOne(l1);
            let parent = itemCollection.findOne(root);

            //This method should not actually be bubbling changes. Ensure that it isn't
            expect(thisNode.descendants).to.equal(2);
            expect(thisNode.completeDescendants).to.equal(1);

            expect(parent.descendants).to.equal(3);
            expect(parent.completeDescendants).to.equal(1);

            expect(itemCollection.findOne(l2done)).to.not.exist;
            expect(itemCollection.findOne(l2not)).to.not.exist;
        });

        it('can remove a node with assorted children', () => {
            let removeNode = Meteor.server.method_handlers['removeNode'];
            let invocation = { userId };

            removeNode.apply(invocation, [l1]);

            let parent = itemCollection.findOne(root);

            expect(parent.descendants).to.equal(0);
            expect(parent.completeDescendants).to.equal(0);
            expect(parent.children.length).to.equal(0);
        });

        it('can remove a node with children, all complete', () => {
            let removeNode = Meteor.server.method_handlers['removeNode'];
            let invocation = { userId };
            itemCollection.update(l2not, {
                    $set: {
                        done: true
                    }
                });
            itemCollection.update(l1, {
                $set: {
                    completeDescendants: 2
                }
            });
            itemCollection.update(root, {
                $set: {
                    completeDescendants: 3
                }
            });

            removeNode.apply(invocation, [l1]);

            let parent = itemCollection.findOne(root);

            expect(parent.descendants).to.equal(0);
            expect(parent.completeDescendants).to.equal(0);
            expect(parent.children.length).to.equal(0);
        });

        it('can remove a node with children, all incomplete', () => {
            let removeNode = Meteor.server.method_handlers['removeNode'];
            let invocation = { userId };
            itemCollection.update(l2done, {
                $set: {
                    done: false
                }
            });
            itemCollection.update(l1, {
                $set: {
                    completeDescendants: 0
                }
            });
            itemCollection.update(root, {
                $set: {
                    completeDescendants: 0
                }
            });

            removeNode.apply(invocation, [l1]);

            let parent = itemCollection.findOne(root);

            expect(parent.descendants).to.equal(0);
            expect(parent.completeDescendants).to.equal(0);
            expect(parent.children.length).to.equal(0);

        });

        it('can remove a root node', () => {
            let removeNode = Meteor.server.method_handlers['removeNode'];
            let invocation = { userId };

            removeNode.apply(invocation, [root]);

            expect(itemCollection.find().count()).to.equal(0);
        });
    });

    describe('Repeatable nodes', () => {
        let root;
        let l1;
        let l2done;
        let l2not;
        let userId;

        beforeEach(() => {
            userId = '10';
            let vals = resetDB(10);
            root = vals.root;
            l1 = vals.l1;
            l2done = vals.l2done;
            l2not = vals.l2not;
        });

        it('can add a repNode to a complete node', () => {
            let addChild = Meteor.server.method_handlers['addChild'];
            let invocation = { userId };
            let repNodeId = addChild.apply(invocation, [{
                parentId: l2done,
                name: 'repNode',
                repeatable: true
            }]);


            let newNode = itemCollection.findOne(repNodeId);
            let parent = itemCollection.findOne(l2done);
            let grandparent = itemCollection.findOne(l1);
            let greatGrandparent = itemCollection.findOne(root);

            expect(newNode.repeatable).to.equal(true);
            expect(newNode.repeated).to.equal(0);
            expect(newNode.repeatableLimit).to.not.exist;
            expect(newNode.done).to.equal(true);

            expect(parent.descendants).to.equal(1);
            expect(parent.completeDescendants).to.equal(1);

            expect(grandparent.descendants).to.equal(3);
            expect(grandparent.completeDescendants).to.equal(2);

            expect(greatGrandparent.descendants).to.equal(4);
            expect(greatGrandparent.completeDescendants).to.equal(2);
        });

        it('can add a limited repNode to a complete node', () => {
            let addChild = Meteor.server.method_handlers['addChild'];
            let invocation = { userId };
            let repNodeId = addChild.apply(invocation, [{
                parentId: l2done,
                name: 'repNode',
                repeatable: true,
                repeatableLimit: 3
            }]);

            let newNode = itemCollection.findOne(repNodeId);
            let parent = itemCollection.findOne(l2done);
            let grandparent = itemCollection.findOne(l1);
            let greatGrandparent = itemCollection.findOne(root);

            expect(newNode.repeatable).to.equal(true);
            expect(newNode.repeated).to.equal(0);
            expect(newNode.repeatableLimit).to.equal(3);
            expect(newNode.done).to.equal(false);

            expect(parent.descendants).to.equal(1);
            expect(parent.completeDescendants).to.equal(0);

            expect(grandparent.descendants).to.equal(3);
            expect(grandparent.completeDescendants).to.equal(0);

            expect(greatGrandparent.descendants).to.equal(4);
            expect(greatGrandparent.completeDescendants).to.equal(0);
        });

        it('can add a repNode to an incomplete node', () => {
            let addChild = Meteor.server.method_handlers['addChild'];
            let invocation = { userId };
            let repNodeId = addChild.apply(invocation, [{ parentId: l2not, name: 'repNode', repeatable: true }]);

            let newNode = itemCollection.findOne(repNodeId);
            let parent = itemCollection.findOne(l2not);
            let grandparent = itemCollection.findOne(l1);
            let greatGrandparent = itemCollection.findOne(root);

            expect(newNode.repeatable).to.equal(true);
            expect(newNode.repeated).to.equal(0);
            expect(newNode.repeatableLimit).to.not.exist;
            expect(newNode.done).to.equal(true);

            expect(parent.descendants).to.equal(1);
            expect(parent.completeDescendants).to.equal(1);

            expect(grandparent.descendants).to.equal(3);
            expect(grandparent.completeDescendants).to.equal(3);

            expect(greatGrandparent.descendants).to.equal(4);
            expect(greatGrandparent.completeDescendants).to.equal(4);
        });

        it('can add a limited repNode to an incomplete node', () => {
            let addChild = Meteor.server.method_handlers['addChild'];
            let invocation = { userId };
            let repNodeId = addChild.apply(invocation, [{ parentId: l2not, name: 'repNode', repeatable: true, repeatableLimit: 3}]);

            let newNode = itemCollection.findOne(repNodeId);
            let parent = itemCollection.findOne(l2not);
            let grandparent = itemCollection.findOne(l1);
            let greatGrandparent = itemCollection.findOne(root);

            expect(newNode.repeatable).to.equal(true);
            expect(newNode.repeated).to.equal(0);
            expect(newNode.repeatableLimit).to.equal(3);
            expect(newNode.done).to.equal(false);

            expect(parent.descendants).to.equal(1);
            expect(parent.completeDescendants).to.equal(0);

            expect(grandparent.descendants).to.equal(3);
            expect(grandparent.completeDescendants).to.equal(1);

            expect(greatGrandparent.descendants).to.equal(4);
            expect(greatGrandparent.completeDescendants).to.equal(1);
        });

        it('can add a repNode as a sibling of other nodes', () => {
            let addChild = Meteor.server.method_handlers['addChild'];
            let invocation = { userId };
            let _id = addChild.apply(invocation, [{ parentId: l1, name: 'repNode', repeatable: true}]);

            let newNode = itemCollection.findOne(_id);
            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(newNode.repeatable).to.equal(true);
            expect(newNode.repeated).to.equal(0);
            expect(newNode.done).to.equal(true);

            expect(parent.descendants).to.equal(3);
            expect(parent.completeDescendants).to.equal(2);

            expect(grandparent.descendants).to.equal(4);
            expect(grandparent.completeDescendants).to.equal(2);
        });

        it('can add a limited repNode as a sibling of other nodes', () => {
            let addChild = Meteor.server.method_handlers['addChild'];
            let invocation = { userId };
            let _id = addChild.apply(invocation, [{ parentId: l1, name: 'repNode', repeatable: true, repeatableLimit: 3}]);

            let newNode = itemCollection.findOne(_id);
            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(newNode.repeatable).to.equal(true);
            expect(newNode.repeated).to.equal(0);
            expect(newNode.repeatableLimit).to.equal(3);
            expect(newNode.done).to.equal(false);

            expect(parent.descendants).to.equal(3);
            expect(parent.completeDescendants).to.equal(1);

            expect(grandparent.descendants).to.equal(4);
            expect(grandparent.completeDescendants).to.equal(1);
        });

        it('can complete a repNode, causing the parent to become complete', () => {
            itemCollection.update(l2not, {
                $set:{
                    repeatable: true,
                    repeatableLimit: 3,
                    repeated:2
                }
            });

            let incReps = Meteor.server.method_handlers['increaseReps'];
            let invocation = { userId };
            incReps.apply(invocation, [l2not]);

            let node = itemCollection.findOne(l2not);
            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(node.done).to.equal(true);
            expect(node.repeated).to.equal(3);
            expect(node.repeatableLimit).to.equal(3);

            expect(parent.descendants).to.equal(2);
            expect(parent.completeDescendants).to.equal(2);

            expect(grandparent.descendants).to.equal(3);
            expect(grandparent.completeDescendants).to.equal(3);
        });

        it('can uncomplete a repNode, causing the parent to become incomplete', () => {
            itemCollection.update(l2not, {
                $set:{
                    repeatable: true,
                    repeatableLimit: 3,
                    repeated:3,
                    done:true
                }
            });
            itemCollection.update(l1, {
                $set:{
                    descendants: 2,
                    completeDescendants:2
                }
            });
            itemCollection.update(root, {
                $set:{
                    descendants:3,
                    completeDescendants:3
                }
            });

            let decReps = Meteor.server.method_handlers['decreaseReps'];
            let invocation = { userId };
            decReps.apply(invocation, [l2not]);

            let node = itemCollection.findOne(l2not);
            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(node.done).to.equal(false);
            expect(node.repeated).to.equal(2);
            expect(node.repeatableLimit).to.equal(3);

            expect(parent.descendants).to.equal(2);
            expect(parent.completeDescendants).to.equal(1);

            expect(grandparent.descendants).to.equal(3);
            expect(grandparent.completeDescendants).to.equal(1);
        });

        it('will correctly throw errors if attempts are made to inc/dec outside of bounds', () => {
            itemCollection.update(l2not, {
                $set:{
                    repeatable: true,
                    repeated:0
                }
            });
            itemCollection.update(l2done, {
                $set:{
                    repeatable:true,
                    repeated:3,
                    repeatableLimit:3
                }
            });

            let incReps = Meteor.server.method_handlers['increaseReps'];
            let decReps = Meteor.server.method_handlers['decreaseReps'];
            let invocation = { userId };

            let incMeth = () => {
                incReps.apply(invocation, [l2done]);
            }
            let decMeth = () => {
                decReps.apply(invocation, [l2not]);
            }

            expect(incMeth).to.throw(Error);
            expect(decMeth).to.throw(Error);
        });

        //The database will be reset before each of these methods and we will add the second test tree in each test case
        it('can adopt a full tree to a non-root node', () => {
            let secondTree = resetDB(userId, true);

            let adopt = Meteor.server.method_handlers['adoptChild'];
            let invocation = { userId };

            adopt.apply(invocation, [secondTree.root, l1]);

            let newParent = itemCollection.findOne(l1);
            let tree2Root = itemCollection.findOne(secondTree.root);
            let tree1Root = itemCollection.findOne(root);

            expect(tree2Root.parent).to.equal(l1);
            expect(newParent.children.length).to.equal(3);
            expect(tree1Root.descendants).to.equal(7);
            expect(newParent.descendants).to.equal(6);
            expect(tree1Root.completeDescendants).to.equal(2);
            expect(newParent.completeDescendants).to.equal(2);
            expect(tree2Root.level).to.equal(2);
        });

        it('can adopt a subtree to a non-root node', () => {
            let secondTree = resetDB(userId, true);

            let adopt = Meteor.server.method_handlers['adoptChild'];
            let invocation = { userId };

            adopt.apply(invocation, [secondTree.l1, l1]);

            let newParent = itemCollection.findOne(l1);
            let tree2Root = itemCollection.findOne(secondTree.root);
            let subtreeRoot = itemCollection.findOne(secondTree.l1);

            expect(tree2Root.descendants).to.equal(0);
            expect(tree2Root.completeDescendants).to.equal(0);
            expect(tree2Root.children.length).to.equal(0);

            expect(subtreeRoot.parent).to.equal(l1);
            expect(subtreeRoot.level).to.equal(2);

            expect(newParent.descendants).to.equal(5);
            expect(newParent.completeDescendants).to.equal(2);
        });

        it('can adopt a single node to a non-root node', () => {
            let secondTree = resetDB(userId, true);

            let adopt = Meteor.server.method_handlers['adoptChild'];
            let invocation = { userId };

            adopt.apply(invocation, [secondTree.l2done, l1]);

            let newParent = itemCollection.findOne(l1);
            let tree2Root = itemCollection.findOne(secondTree.root);
            let oldParent = itemCollection.findOne(secondTree.l1);
            let child = itemCollection.findOne(secondTree.l2done);

            expect(newParent.children.length).to.equal(3);
            expect(newParent.descendants).to.equal(3);
            expect(newParent.completeDescendants).to.equal(2);

            expect(tree2Root.descendants).to.equal(2);
            expect(tree2Root.completeDescendants).to.equal(0);

            expect(oldParent.descendants).to.equal(1);
            expect(oldParent.completeDescendants).to.equal(0);
            expect(oldParent.children.length).to.equal(1);

            expect(child.parent).to.equal(l1);
            expect(child.level).to.equal(2);
        });

        it('can orphan a subtree into a new tree', () => {
            let secondTree = resetDB(userId, true);

            let adopt = Meteor.server.method_handlers['adoptChild'];
            let invocation = { userId };

            adopt.apply(invocation, [secondTree.l1, null]);

            let subtreeRoot = itemCollection.findOne(secondTree.l1);
            let oldParent = itemCollection.findOne(secondTree.root);

            expect(subtreeRoot.level).to.equal(0);
            expect(subtreeRoot.descendants).to.equal(2);
            expect(subtreeRoot.parent).to.equal(null);

            expect(oldParent.children).to.equal(0);
            expect(oldParent.descendants).to.equal(0);
            expect(oldParent.completeDescendants).to.equal(0);
        });

        it('can orphan a single complete node into a new tree', () => {
            let secondTree = resetDB(userId, true);

            let adopt = Meteor.server.method_handlers['adoptChild'];
            let invocation = { userId };

            adopt.apply(invocation, [secondTree.l2done, null]);

            let oldParent = itemCollection.findOne(secondTree.l1);
            let child = itemCollection.findOne(secondTree.l2done);
            let tree2Root = itemCollection.findOne(secondTree.root);

            expect(oldParent.children.length).to.equal(1);
            expect(oldParent.descendants).to.equal(1);
            expect(oldParent.completeDescendants).to.equal(0);

            expect(child.level).to.equal(0);
            expect(child.parent).to.equal(null);

            expect(tree2Root.descendants).to.equal(2);
            expect(tree2Root.completeDescendants).to.equal(0);
        });

        it('can orphan a single incomplete node into a new tree', () => {
            let secondTree = resetDB(userId, true);

            let adopt = Meteor.server.method_handlers['adoptChild'];
            let invocation = { userId };

            adopt.apply(invocation, [secondTree.l2not, null]);

            let oldParent = itemCollection.findOne(secondTree.l1);
            let child = itemCollection.findOne(secondTree.l2not);
            let tree2Root = itemCollection.findOne(secondTree.root);

            expect(oldParent.children.length).to.equal(1);
            expect(oldParent.descendants).to.equal(1);
            expect(oldParent.completeDescendants).to.equal(1);

            expect(child.level).to.equal(0);
            expect(child.parent).to.equal(null);

            expect(tree2Root.descendants).to.equal(2);
            expect(tree2Root.completeDescendants).to.equal(2);
        });

        it('will throw a is-root error if we attempt to orphan a root node', () => {
            let adopt = Meteor.server.method_handlers['adoptChild'];
            let invocation = { userId };

            let adoptMethod = () => {
                adopt.apply(invocation, [root, null]);
            };

            expect(adoptMethod).to.throw(Error);
        });

        it('can adopt a node to a complete parent, causing it to remain complete', () => {
            let secondTree = resetDB(userId, true);

            itemCollection.remove(l2not);
            itemCollection.update(l1, {
                $set:{
                    descendants:1,
                    completeDescendants: 1
                }
            });
            itemCollection.update(root, {
                $set:{
                    descendants:2,
                    completeDescendants:2
                }
            });

            let adopt = Meteor.server.method_handlers['adoptChild'];
            let invocation = { userId };

            adopt.apply(invocation, [secondTree.l2done, l1]);

            let rootNode = itemCollection.findOne(root);

            expect(rootNode.descendants).to.equal(3);
            expect(rootNode.completeDescendants).to.equal(3);
        });

        it('can adopt a node to a complete parent, causing it to become incomplete', () => {
            let secondTree = resetDB(userId, true);

            let adopt = Meteor.server.method_handlers['adoptChild'];
            let invocation = { userId };

            adopt.apply(invocation, [secondTree.root, l2not]);

            let newParent = itemCollection.findOne(l2not);
            let rootNode = itemCollection.findOne(root);

            expect(newParent.children.length).to.equal(1);
            expect(newParent.descendants).to.equal(1);
            expect(newParent.completeDescendants).to.equal(1);

            expect(rootNode.completeDescendants.to.equal(1));
        });
    });

    //TODO test will multiple trees
    describe('Tree data generators', () => {
        let root;
        let l1;
        let l2done;
        let l2not;
        let userId;

        beforeEach(() => {
            userId = '10';
            let vals = resetDB(userId);
            root = vals.root;
            l1 = vals.l1;
            l2done = vals.l2done;
            l2not = vals.l2not;
        });

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

        it('can generate the structure to be displayed by cytoscape', () => {
            // We need to be able to give a funciton that takes a callback to Meteor.wrapAsync
            // This function is the one we're going to send
            let visTreeData = Meteor.server.method_handlers['visTreeData'];
            let invocation = { userId };

            let data = visTreeData.apply(invocation);
            let expected = [{ data: { id: root, name: 'root' }, scratch: { parent: null }, classes: 'root' },
             { data: { id: l1, name: 'l1' }, scratch: { parent: root }, classes: '' },
             { data: { id: l2done, name: 'l2done' }, scratch: { parent: l1 }, classes: '' },
             { data: { id: l2not, name: 'l2not' }, scratch: { parent: l1 }, classes: '' },
             { data: { id: 'edgeId0', target: l1, source: root } },
             { data: { id: 'edgeId1', target: l2done, source: l1 } },
             { data: { id: 'edgeId2', target: l2not, source: l1 } }];

            expect(data[0]).to.have.deep.property('data.id', root);
            expect(data[0]).to.have.deep.property('data.name', 'root');
            expect(data[0]).to.have.deep.property('scratch.parent', null);
            expect(data[0]).to.have.property('classes', 'root');

            expect(data[1]).to.have.deep.property('data.id', l1);
            expect(data[1]).to.have.deep.property('data.name', 'l1');
            expect(data[1]).to.have.deep.property('scratch.parent', root);
            expect(data[1]).to.have.property('classes', '');

            expect(data[2]).to.have.deep.property('data.id', l2done);
            expect(data[2]).to.have.deep.property('data.name', 'l2done');
            expect(data[2]).to.have.deep.property('scratch.parent', l1);
            expect(data[2]).to.have.property('classes', 'complete ');

            expect(data[3]).to.have.deep.property('data.id', l2not);
            expect(data[3]).to.have.deep.property('data.name', 'l2not');
            expect(data[3]).to.have.deep.property('scratch.parent', l1);
            expect(data[3]).to.have.property('classes', '');

            expect(data[4]).to.have.deep.property('data.id', 'edgeId0');
            expect(data[4]).to.have.deep.property('data.target', l1);
            expect(data[4]).to.have.deep.property('data.source', root);

            expect(data[5]).to.have.deep.property('data.id', 'edgeId1');
            expect(data[5]).to.have.deep.property('data.target', l2done);
            expect(data[5]).to.have.deep.property('data.source', l1);

            expect(data[6]).to.have.deep.property('data.id', 'edgeId2');
            expect(data[6]).to.have.deep.property('data.target', l2not);
            expect(data[6]).to.have.deep.property('data.source', l1);
        });

    });
});