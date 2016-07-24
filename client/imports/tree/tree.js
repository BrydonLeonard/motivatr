import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';
import { $ } from 'meteor/jquery';
import { itemCollection } from '../../../shared/imports/dbSetup';

import trees from 'trees.js';

import './tree.html';
import * as confirmModal from '../modals/confirmModal';

let svg;

/**
 * Toggles a node's 'done' state if toggle is true, otherwise simply fetch from the db if it is done.
 * (This should occur due to bubble complete).
 * @param node
 */
let toggleNodeColor = function(node, toggle) {
    // Very hacky, need to add methods to trees.js for this.
    if(node) {
        if (toggle) {
            node.done = !node.done;
            if (node.done) {
                svg.current.fill = '#4db6ac';
                svg.current.stroke = '#4db6ac';
            } else {
                svg.current.fill = '#e57373';
                svg.current.stroke = '#e57373';
            }
        } else {
            if (node.done) {
                svg.setColor(node, {
                    fill: '#4db6ac',
                    stroke: '#4db6ac'
                });
            } else {
                svg.setColor(node, {
                    fill: '#e57373',
                    stroke: '#e57373'
                });
            }
        }
        if (node.parent) {
            let parent = itemCollection.findOne(node.parent.id);
            if (parent) {
                node.parent.done = parent.completeDescendants === parent.descendants;
                toggleNodeColor(node.parent);
            }
        }
    }
}

/**
 * When the treeContainer template is created, initialise the selected node reactive variable.
 */
Template.treeContainer.onCreated(function() {
    this.selectedNode = new ReactiveVar(null);
    confirmModal.addToTemplate($('body')[0]);
    Meteor.subscribe('itemCollection');
});

/**
 * When the treeContainer template is destroyed, remove the window's listeners.
 */
Template.treeContainer.onDestroyed(function() {
    svg.removeEventListeners();
});

/**
 * When the treeContainer template is rendered, get the data from the server and display it
 */
Template.treeContainer.onRendered(function(){
    var instance = this;
    svg = new trees.SVG('treesSVG', {
        width: '100%',
        height: '91%'
    });

    svg.setSelectedAction(function(node) {
        instance.selectedNode.set(node);
    });

    svg.setDeselectedAction(function() {
        instance.selectedNode.set(null);
    });

    Meteor.call('desktopTreeData', function(e, elements) {
        if(!e) {
            if(elements) {
                for (let i = 0; i < elements.length; i++) {
                    svg.drawTree(elements[i], {
                        lineStroke: '6fd8ce',
                        fill: '#e57373',
                        stroke: '#e57373',
                        rootFill: '#e57373',
                        rootStroke: '#e57373',
                        selectedFill: '#7ced94',
                        selectedStroke: '#7ced94'
                    });
                    // Hacky solution, will update trees.js soon and fix this
                    svg.trees[svg.trees.length - 1].traverse(function(node) {
                        if(node.done) {
                            svg.setColor(node, {
                                fill: '#4db6ac',
                                stroke: '#4db6ac'
                            });
                        }
                    });
                }
            }
        }
    });
});

/**
 * Sets the anchor of the nodes, there are 3 selection modes.
 */
Template.treeContainer.events({
    'click #none': function(e) {
        e.preventDefault();
        svg.setAnchor('none');
        $('#mainFAB').text('play_arrow');
        $('#mainFABColor').removeClass('red').removeClass('green').addClass('blue');
        $('.fixed-action-btn').closeFAB();
    },
    'click #children': function(e) {
        e.preventDefault();
        svg.setAnchor('children');
        $('#mainFAB').text('fast_forward');
        $('#mainFABColor').removeClass('red').removeClass('blue').addClass('green');
        $('.fixed-action-btn').closeFAB();
    },
    'click #descendents': function(e) {
        e.preventDefault();
        svg.setAnchor('descendents');
        $('#mainFAB').text('skip_next');
        $('#mainFABColor').removeClass('blue').removeClass('green').addClass('red');
        $('.fixed-action-btn').closeFAB();
    },
    'click #delete': function(e, instance) {
        e.preventDefault();
        confirmModal.displayModal("Are you sure you want to delete the current node?", function(res) {
            if(res) {
                var removedNode = svg.removeNode(instance.selectedNode.get(), false);
                if(removedNode) {
                    Meteor.call('removeNode', removedNode.id, function(err) {
                        if(!err) {
                            toggleNodeColor(removedNode);
                        }
                    });
                    instance.selectedNode.set(null);
                }
            }
        });
    },
    'click #done':function(e, instance) {
        e.preventDefault();
        var node = instance.selectedNode.get();
        Meteor.call('toggleComplete', node.id, function(err) {
            if(!err) {
                toggleNodeColor(instance.selectedNode.get(), true);
                instance.selectedNode.set(node);
            }
        });
    }
});

Template.treeContainer.helpers({
    selectedNode() {
        return Template.instance().selectedNode.get();
    },
    isLeafNode() {
        let children = Template.instance().selectedNode.get().children;
        return children && children.length === 0;
    },
    isDone() {
        return Template.instance().selectedNode.get().done;
    }
});