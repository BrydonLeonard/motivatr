import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';
import { $ } from 'meteor/jquery';

import trees from 'trees.js';

import './tree.html';

let svg;

/**
 * When the treeContainer template is created, initialise the selected node reactive variable.
 */
Template.treeContainer.onCreated(function() {
    this.selectedNode = new ReactiveVar(null);
});

/**
 * When the treeContainer template is rendered, get the data from the server and display it
 */
Template.treeContainer.onRendered(function(){
    var instance = this;
    svg = new trees.SVG('treesSVG', {
        width: '100%',
        height: '92%'
    });

    svg.setSelectedAction(function(node) {
        instance.selectedNode.set(node);
    });

    Meteor.call('desktopTreeData', function(e, elements) {
        if(!e) {
            if(elements) {
                for (let i = 0; i < elements.length; i++) {
                    svg.drawTree(elements[i], {
                        fill: '#4db6ac',
                        stroke: '#4db6ac',
                        rootFill: '#a6d4fb',
                        rootStroke: '#a6d4fb',
                        selectedFill: '#7ced94',
                        selectedStroke: '#7ced94'
                    });
                }
            }
        }
    });
});

Template.on

/**
 * Sets the anchor of the nodes, there are 3 selection modes.
 */
Template.treeContainer.events({
    'click #none': function(e) {
        svg.setAnchor('none');
        $('#mainFAB').text('play_arrow');
        $('#mainFABColor').removeClass('red').removeClass('green').addClass('blue');
        $('.fixed-action-btn').closeFAB();
    },
    'click #children': function(e) {
        svg.setAnchor('children');
        $('#mainFAB').text('fast_forward');
        $('#mainFABColor').removeClass('red').removeClass('blue').addClass('green');
        $('.fixed-action-btn').closeFAB();
    },
    'click #descendents': function(e) {
        svg.setAnchor('descendents');
        $('#mainFAB').text('skip_next');
        $('#mainFABColor').removeClass('blue').removeClass('green').addClass('red');
        $('.fixed-action-btn').closeFAB();
    },
    'click #delete': function(e, instance) {
        var removedNode = svg.removeNode(instance.selectedNode.get(), false);
        if(removedNode) {
            Meteor.call('removeNode', removedNode.id);
            instance.selectedNode.set(null);
        }
    }
});

Template.treeContainer.helpers({
    selectedNode() {
        return Template.instance().selectedNode.get();
    }
});