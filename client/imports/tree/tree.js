import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';
import { $ } from 'meteor/jquery';

import trees from 'trees.js';

import './tree.html';
import * as confirmModal from '../modals/confirmModal';

let svg;

/**
 * When the treeContainer template is created, initialise the selected node reactive variable.
 */
Template.treeContainer.onCreated(function() {
    this.selectedNode = new ReactiveVar(null);
    confirmModal.addToTemplate($('body')[0]);
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
                    Meteor.call('removeNode', removedNode.id);
                    instance.selectedNode.set(null);
                }
            }
        });
    },
    'click #done':function(e, instance) {
        e.preventDefault();
        var node = instance.selectedNode.get();
        Meteor.call('toggleComplete', node.id);
        // Very hacky, need to add methods to trees.js for this.
        if(node.done) {
            svg.current.fill = '#e57373';
            svg.current.stroke = '#e57373';
        } else {
            svg.current.fill = '#4db6ac';
            svg.current.stroke = '#4db6ac';
        }
        node.done = !node.done;
        instance.selectedNode.set(node);
    }
});

Template.treeContainer.helpers({
    selectedNode() {
        return Template.instance().selectedNode.get();
    },
    isDone() {
        return Template.instance().selectedNode.get().done;
    }
});