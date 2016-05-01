import { Meteor } from 'meteor/meteor';
import { expect } from 'meteor/practicalmeteor:chai';
import { itemCollection } from './imports/dbSetup';
import './main';

let resetDB = function(user){
    itemCollection.remove({});

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
        user
    });

    let l2not = itemCollection.insert({
        level: 2,
        descendants: 0,
        completeDescendants: 0,
        name: 'l2not',
        done: false,
        parent: l1,
        user
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
    describe('Tree modifiers', () => {
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

        it('can add a new leaf node', () => {
            let addChild = Meteor.server.method_handlers['addChild'];
            let invocation = { userId };

            let _id = addChild.apply(invocation, [l1, 'newNode']);

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

            let _id = addChild.apply(invocation, [l2done, 'newNode']);

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

            let _id = addChild.apply(invocation, [null, 'newNode']);

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

        });

        it('can generate the structure to be displayed by cytoscape', () => {
            // We need to be able to give a funciton that takes a callback to Meteor.wrapAsync
            // This function is the one we're going to send
            let visTreeData = Meteor.server.method_handlers['visTreeData'];
            let invocation = { userId };

            let data = visTreeData.apply(invocation);
            let expected = [{ data: { id: root, parent: null, name: 'root' }, classes: 'root' },
             { data: { id: l1, name: 'l1', parent: root }, classes: '' },
             { data: { id: l2done, name: 'l2done', parent: l1 }, classes: '' },
             { data: { id: l2not, name: 'l2not', parent: l1 }, classes: '' },
             { data: { id: 'edgeId0', target: l1, source: root } },
             { data: { id: 'edgeId1', target: l2done, source: l1 } },
             { data: { id: 'edgeId2', target: l2not, source: l1 } }];

            for (let i = 0; i < data.length; i++){
                expect(data[i]).to.eql(expected[i]);
            }
        });

    });
});