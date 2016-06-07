import { expect } from 'meteor/practicalmeteor:chai';
import { itemCollection } from './dbSetup';
import * as serializer from './serializer';

describe('serialization methods', () => {
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

    it('can serialize a tree correctly', () => {
        let serString = serializer.serializeTree(root);
        expect(serString).to.equal('{"n":"root","c":[{"n":"l1","c":[{"n":"l21","c":[]},{"n":"l22","c":[]}]}]}');
    });

    it('can serialize a subtree correctly', () => {
        let serString = serializer.serializeTree(l1);
        expect(serString).to.equal('{"n":"l1","c":[{"n":"l21","c":[]},{"n":"l22","c":[]}]}');
    });

    it('can deserialize a tree correctly to a root', () => {
        itemCollection.remove({});
        expect(itemCollection.find().count()).to.equal(0);

        serializer.deserializeTree('{"n":"root","c":[{"n":"l1","c":[{"n":"l21","c":[]},{"n":"l22","c":[]}]}]}', null, 15);

        console.log(itemCollection.find().fetch());


        let rootNode = itemCollection.findOne({name:"root"});
        let l1Node = itemCollection.findOne({name:"l1"});
        let l2doneNode = itemCollection.findOne({name:"l21"});

        expect(rootNode.descendants).to.equal(3);
        expect(rootNode.completeDescendants).to.equal(0);
        expect(rootNode.children.length).to.equal(1);
        expect(rootNode.user).to.equal(15);

        expect(l1Node.descendants).to.equal(2);4
        expect(l1Node.children.length).to.equal(2);
        expect(l1Node.completeDescendants).to.equal(0);
        expect(l1Node.user).to.equal(15);

        expect(l2doneNode.descendants).to.equal(0);
        expect(l2doneNode.done).to.equal(false);
        expect(l2doneNode.children.length).to.equal(0);
        expect(l2doneNode.user).to.equal(15);
    });

    it('can deserialize a tree correctly as a subtree', () => {
        serializer.deserializeTree('{"n":"newl1","c":[{"n":"newl21","c":[]},{"n":"newl22","c":[]}]}', root, 15);

        let rootNode = itemCollection.findOne(root);
        let newl1 = itemCollection.findOne({name:'newl1'});
        let newl21 = itemCollection.findOne({name:'newl21'});
        let newl22 = itemCollection.findOne({name:'newl22'});

        expect(rootNode.descendants).to.equal(6);
        expect(rootNode.completeDescendants).to.equal(1);
        expect(rootNode.children.length).to.equal(2);

        expect(newl1.descendants).to.equal(2);
        expect(newl1.completeDescendants).to.equal(0);
        expect(newl1.children.length).to.equal(2);
        expect(newl1.user).to.equal(15);

        expect(newl21.descendants).to.equal(0);
        expect(newl21.done).to.equal(false);
        expect(newl21.children.length).to.equal(0);
        expect(newl21.user).to.equal(15);

        expect(newl22.descendants).to.equal(0);
        expect(newl22.done).to.equal(false);
        expect(newl22.children.length).to.equal(0);
        expect(newl22.user).to.equal(15);
    })
});