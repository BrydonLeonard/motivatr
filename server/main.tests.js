import { expect } from 'meteor/practicalmeteor:chai';
import { itemCollection } from './imports/dbSetup';
import './main.js';

let resetDb = function(){
    itemCollection.remove({});

    // Insert framework objects, with only fields necessary for testing
    let root = itemCollection.insert({
        level: 0,
        descendants: 3,
        completeDescendants: 1,
        name: 'root',
        parent: null,
        children: []
    });

    let l1 = itemCollection.insert({
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

    let l2done = itemCollection.insert({
        level: 2,
        descendants: 0,
        completeDescendants: 0,
        name: 'l2done',
        done: true,
        parent: l1
    });

    let l2not = itemCollection.insert({
        level: 2,
        descendants: 0,
        completeDescendants: 0,
        name: 'l2not',
        done: false,
        parent: l1
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

describe('Server methods', () => {
    describe('Tree modifiers', () => {
        let root;
        let l1;
        let l2done;
        let l2not;

        beforeEach(() => {
            let vals = resetDb();
            root = vals.root;
            l1 = vals.l1;
            l2done = vals.l2done;
            l2not = vals.l2not;
        });

        it('can add a new leaf node', () => {
            Meteor.call('addChild', l1, 'newNode');

            let thisItem = itemCollection.findOne({name: 'newNode'});
            expect(thisItem).to.exist;

            expect(thisItem.parent).to.equal(l1);
            expect(thisItem.name).to.equal('newNode');
            expect(thisItem.descendants).to.equal(0);
            expect(thisItem.completeDescendants).to.equal(0);
            expect(thisItem.done).to.equal(false);

            let parent = itemCollection.findOne({children: thisItem._id});
            expect(parent).to.exist;

            expect(parent.children).to.include.members([thisItem._id]);
            expect(parent.descendants).to.equal(3);
            expect(parent.completeDescendants).to.equal(1);
        });

        it('can toggle a node (complete -> incomplete)', () => {
            Meteor.call('toggleComplete', l2done);

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
            Meteor.call('toggleComplete', l2not);

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
            Meteor.call('removeNode', l2not);

            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(parent.descendants).to.equal(1);
            expect(parent.completeDescendants).to.equal(1);

            expect(grandparent.descendants).to.equal(2);
            expect(grandparent.completeDescendants).to.equal(2);
        });

        it('can remove a complete node', () => {
            Meteor.call('removeNode', l2done);

            let parent = itemCollection.findOne(l1);
            let grandparent = itemCollection.findOne(root);

            expect(parent.descendants).to.equal(1);
            expect(parent.completeDescendants).to.equal(0);

            expect(grandparent.descendants).to.equal(2);
            expect(grandparent.completeDescendants).to.equal(0);
        });
    });

    describe('Tree data generators', () => {
        let root;
        let l1;
        let l2done;
        let l2not;

        beforeEach(() => {
            let vals = resetDb();
            root = vals.root;
            l1 = vals.l1;
            l2done = vals.l2done;
            l2not = vals.l2not;
        });

        it('can generate the structure to be displayed by jqtree', () => {
            // We need to be able to give a funciton that takes a callback to Meteor.wrapAsync
            // This function is the one we're going to send
            let f = function(callback){
                Meteor.call('visTreeData', callback);
            };
            // Create a synchronous function from f
            let data = Meteor.wrapAsync(f);
            // Run Meteor.call('visTreeData') synchronously
            data = data();

            let expected = [{ data: { id: root, parent: null, name: 'root' }, classes: 'root' },
             { data: { id: l1, name: 'l1', parent: root }, classes: '' },
             { data: { id: l2done, name: 'l2done', parent: l1 }, classes: '' },
             { data: { id: l2not, name: 'l2not', parent: l1 }, classes: '' },
             { data: { id: 'edgeId0', target: l1, source: root } },
             { data: { id: 'edgeId1', target: l2done, source: l1 } },
             { data: { id: 'edgeId2', target: l2not, source: l1 } }];

            console.log(data == expected);

            expect(data).to.have.same.members(expected);
        });
    });
});