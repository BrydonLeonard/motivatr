import { expect } from 'meteor/practicalmeteor:chai';
import { itemCollection } from './../../shared/imports/dbSetup';
import { getDesktopChildren } from './desktopTreeHelpers';

describe('desktopTreeHelpers', () => {
	describe('#getDesktopChildren', () => {
		beforeEach(() => {
			itemCollection.remove({});

			root = itemCollection.insert({
				_id: "mgb6Bf2YfHcYrCFgi",
				parent: null,
				name: "root",
				priority: 0,
				user: "4496Mjbug3NFMDDF4",
				level: 0,
				children: [
					"gfgJ7dJotWQnFwrhn",
					"62R8owstzp78prcxZ"
				],
				done: false,
				descendants: 6,
				completeDescendants: 4
			});

			first = itemCollection.insert({
				_id: "gfgJ7dJotWQnFwrhn",
				parent: "mgb6Bf2YfHcYrCFgi",
				name: "first",
				priority: 0,
				user: "4496Mjbug3NFMDDF4",
				level: 1,
				children: [
					"pkoBPY6NSSCEtPiBQ",
					"467JCYB9SzYfSwfy3"
				],
				done: false,
				descendants: 2,
				completeDescendants: 2
			});
			firstFirst = itemCollection.insert({
				_id: "pkoBPY6NSSCEtPiBQ",
				parent: "gfgJ7dJotWQnFwrhn",
				name: "first-first",
				priority: 0,
				user: "4496Mjbug3NFMDDF4",
				level: 2,
				children: [],
				done: true,
				descendants: 0,
				completeDescendants: 0
			});
			firstSecond = itemCollection.insert({
				_id: "467JCYB9SzYfSwfy3",
				parent: "gfgJ7dJotWQnFwrhn",
				name: "first-second",
				priority: 0,
				user: "4496Mjbug3NFMDDF4",
				level: 2,
				children: [],
				done: true,
				descendants: 0,
				completeDescendants: 0
			});

			second = itemCollection.insert({
				_id: "62R8owstzp78prcxZ",
				parent: "mgb6Bf2YfHcYrCFgi",
				name: "second",
				priority: 0,
				user: "4496Mjbug3NFMDDF4",
				level: 1,
				children: [
					"cdX3Nm92KYkKGNxPw",
					"dmN9cwPpft6RCJSSg"
				],
				done: false,
				descendants: 2,
				completeDescendants: 1
			});
			secondFirst = itemCollection.insert({
				_id: "cdX3Nm92KYkKGNxPw",
				parent: "62R8owstzp78prcxZ",
				name: "second-first",
				priority: 0,
				user: "4496Mjbug3NFMDDF4",
				level: 2,
				children: [],
				done: true,
				descendants: 0,
				completeDescendants: 0
			});
			secondSecond = itemCollection.insert({
				_id: "dmN9cwPpft6RCJSSg",
				parent: "62R8owstzp78prcxZ",
				name: "second-second",
				priority: 0,
				user: "4496Mjbug3NFMDDF4",
				level: 2,
				children: [],
				done: false,
				descendants: 0,
				completeDescendants: 0
			});
		});

		it('gets the children of a node', () => {
			let rootChildren = getDesktopChildren(root._id);
			rootChildren.forEach(function(child) {
				expect(child._id === first._id || child._id === second._id);
			});
		});
		it('returns an array of tree structures', () => {
			let rootChildren = getDesktopChildren(root._id);
			rootChildren.forEach(function(node) {
				checkChildren(node);
			});
		});
		it('supports trees.js format', () => {
			let rootChildren = getDesktopChildren(root._id);
			// Check the first child encountered
			let firstDesktop = rootChildren[0];
			expect(firstDesktop.children).to.exist;
			expect(firstDesktop.contents).to.exist;
		});
	});
});

let checkChildren = function(node) {
	expect(node.contents).to.exist;
	expect(node.children).to.exist;
	if(node.children && node.children.length > 0) {
		node.children.forEach(function (child) {
			checkChildren(child);
		});
	}
};