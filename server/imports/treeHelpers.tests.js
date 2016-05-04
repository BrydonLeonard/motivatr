import { expect } from 'meteor/practicalmeteor:chai';
import { itemCollection } from './dbSetup';
import { progress, bubbleComplete, bubbleRemove, sinkRemove, bubbleAdd, addLeaf, removeLeaf } from './treeHelpers';

describe('treeHelpers', () => {
    describe('helpers', () => {
        let root;
        let l1;
        let l2done;
        let l2not;

        beforeEach(() => {
            itemCollection.remove({});

            // Insert framework objects, with only fields necessary for testing
            root = itemCollection.insert({
                level: 0,
                descendants: 3,
                completeDescendants: 1,
                name: 'root',
                parent: null,
                children: []
            });

            l1 = itemCollection.insert({
                level: 1,
                descendants: 2,
                completeDescendants: 1,
                name: 'l1',
                parent: root,
                children: []
            });

            itemCollection.update(root, {
                $push: {
                    children: l1
                }
            });

            l2done = itemCollection.insert({
                level: 2,
                descendants: 0,
                completeDescendants: 0,
                name: 'l21',
                done: true,
                parent: l1,
                children: []
            });

            l2not = itemCollection.insert({
                level: 2,
                descendants: 0,
                completeDescendants: 0,
                name: 'l22',
                done: false,
                parent: l1,
                children: []
            });

            itemCollection.update(l1, {
                $push: {
                    children: {
                        $each: [l2done, l2not]
                    }
                }
            });
        });

        it('can remove a leaf node (from db and parent)', () => {
            removeLeaf(l2not);

            expect(itemCollection.find(l2not).count()).to.equal(0);
            expect(itemCollection.find({children:l2not}).count()).to.equal(0);
        });

        it('can add a leaf node', () => {
            let _id = addLeaf(l1, 'newNode', null);

            expect(itemCollection.find({children:_id}).count()).to.equal(1);

            let newNode = itemCollection.findOne(_id);
            expect(newNode).to.exist;
            expect(newNode.parent).to.equal(l1);
            expect(newNode.level).to.equal(2);
            expect(newNode.name).to.equal('newNode');
        });

        it('can add a root node', () => {
            let _id = addLeaf(null, 'newNode', null);

            expect(itemCollection.find({children:_id}).count()).to.equal(0);

            let newNode = itemCollection.findOne(_id);
            expect(newNode).to.exist;
            expect(newNode.parent).to.equal(null);
            expect(newNode.level).to.equal(0);
            expect(newNode.name).to.equal('newNode');
        });

        //The 2 completion toggle methods need to be tested first.
        //The others in the module depend on them
        it('can bubble toggle a task (incomplete -> complete)', () => {
            bubbleComplete(l2not, 1);

            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(parent.completeDescendants).to.equal(2);
            expect(parent.descendants).to.equal(2);

            expect(grandparent.completeDescendants).to.equal(3);
            expect(grandparent.descendants).to.equal(3);
        });

        it('can bubble toggle a task (complete -> incomplete)', () => {
            bubbleComplete(l2done, -1);

            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(parent.completeDescendants).to.equal(0);
            expect(parent.descendants).to.equal(2);

            expect(grandparent.completeDescendants).to.equal(0);
            expect(grandparent.descendants).to.equal(3);
        });

        it('can bubble toggle a task (complete -> incomplete -> complete) where the parent is incomplete', () => {
            bubbleComplete(l2done, -1);
            bubbleComplete(l2done, 1);

            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(parent.completeDescendants).to.equal(1);
            expect(parent.descendants).to.equal(2);

            expect(grandparent.completeDescendants).to.equal(1);
            expect(grandparent.descendants).to.equal(3);
        });

        it('can bubble toggle a task (incomplete -> complete -> incomplete) where the parent follows the same toggle pattern', () => {
            bubbleComplete(l2not, 1);
            bubbleComplete(l2not, -1);

            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(parent.completeDescendants).to.equal(1);
            expect(parent.descendants).to.equal(2);

            expect(grandparent.completeDescendants).to.equal(1);
            expect(grandparent.descendants).to.equal(3);
        });
        
        it('can bubble remove an uncompleted task', () => {
            //Remove the item from the database
            bubbleRemove(l2not, false);

            //This provides the same functionality as removeLeaf
            //Don't want to use too many other methods inside tests
            itemCollection.remove(l2not);

            itemCollection.update({children:l2not},{
                $pull:{
                    children: l2not
                }
            });

            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(parent.completeDescendants).to.equal(1);
            expect(parent.descendants).to.equals(1);

            expect(grandparent.completeDescendants).to.equal(2);
            expect(grandparent.descendants).to.equals(2);
        });

        it('can bubble remove a completed task', () => {

            //Remove from db
            bubbleRemove(l2done, true);
            itemCollection.remove(l2done);

            itemCollection.update({children:l2done}, {
                $pull:{
                    children: l2done
                }
            });

            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(parent.completeDescendants).to.equal(0);
            expect(parent.descendants).to.equal(1);

            expect(grandparent.completeDescendants).to.equal(0);
            expect(grandparent.descendants).to.equal(2);
        });

        it('can sink remove children of a node with children', () => {
            sinkRemove(l1);

            let thisNode = itemCollection.findOne(l1);
            let parent = itemCollection.findOne(root);

            console.log(thisNode);
            console.log(parent);

            expect(thisNode.descendants).to.equal(0);
            expect(thisNode.completeDescendants).to.equal(0);

            expect(parent.descendants).to.equal(1);
            expect(parent.completeDescendants).to.equal(0);
        });

        it('can run sink remove on a node with no children', () => {
            sinkRemove(l2done);

            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(parent.descendants).to.equal(2);
            expect(parent.completeDescendants).to.equal(1);

            expect(grandparent.descendants).to.equal(3);
            expect(grandparent.completeDescendants).to.equal(1);
        });

        it('can remove all children from a node', () => {
            bubbleRemove(l2done, true);
            bubbleRemove(l2not, false);

            itemCollection.remove(l2done);
            itemCollection.remove(l2not);

            itemCollection.update(l1, {
                $pullAll:{
                    children: [l2done, l2not]
                }
            });


            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(parent.completeDescendants).to.equal(0);
            expect(parent.descendants).to.equal(0);

            expect(grandparent.completeDescendants).to.equal(0);
            expect(grandparent.descendants).to.equal(1);
        });

        it('can bubble add a task', () => {
            let newId = itemCollection.insert({
                level: 2,
                descendants: 0,
                completeDescendants: 0,
                name: 'l23',
                done: false,
                parent: l1
            });

            itemCollection.update(l1, {
                $push: {
                    children: newId
                }
            });

            bubbleAdd(newId);

            expect(itemCollection.find({children:newId}).count()).to.equal(1);

            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(parent.completeDescendants).to.equal(1);
            expect(parent.descendants).to.equal(3);

            expect(grandparent.completeDescendants).to.equal(1);
            expect(grandparent.descendants).to.equal(4);
        });
    });
});