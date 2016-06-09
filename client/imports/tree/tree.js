import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';
import { $ } from 'meteor/jquery';
//import  { cytoscape } from 'cytoscape'; // Until the failed to parse sourcemap bug is fixed, we load this ourselves
let cytoscape = require('./cytoscape.js');
let cydagre = require('cytoscape-dagre');
let dagre = require('./dagre');
let cyCose = require('./cytoscape-cose-bilkent');
import './tree.html';

/**
 * When the treeContainer template is rendered, get the data from the server and display it
 */
Template.treeContainer.onRendered(function(){
    var template = Template.instance();
    Meteor.call('getParents', function(error, result){
        if (!error){
            template.treeParents.set(result);
        }
    });
    //Initialise the modal
    $('.modal-trigger').leanModal({
        dismissible: true
    });

    $('select').material_select();

    Meteor.call('visTreeData', function(e, elements) {
        cydagre(cytoscape, dagre);

        let cy = cytoscape({
            container: $('#chart_div'),
            elements: elements,
            style: styleArr,

            layout: {
                name: 'dagre',
                rankDir: 'LR',
                nodeSep: 10,
                rankSep: 20,
                padding:25,
                fit: false
            }
        });

        cy.nodes().on('click', function () {
            if (this._private.classes.selected) {
                this.removeClass('selected');
            } else {
                this.addClass('selected');
            }
        });
    });
});

Template.treeContainer.onCreated(function(){
    var template = Template.instance();
    template.treeParents = new ReactiveVar(null);
    Meteor.call('getParents', function(error, result){
        if (!error){
            template.treeParents.set(result);
        }
    });
});

Template.treeContainer.events({
    'change #selectedTrees':function(event){
        //Have a feature here to check for an "all trees" option
    },
    'click #openTreeSettings': function(event){
        $("option").each(function(){
            if(this.innerHTML == 'All'){
                this.style.selected = true;
            };
        });
        $('select').material_select();
    },
    'click #apply': function(event){
        let allTrees = document.getElementById('selectedTrees').options;

        let trees = [];
        for(var i=0; i<allTrees.length; i++){
            if(allTrees[i].selected == true){
                trees.push(allTrees[i].id);
            }
        }
        
        let hideCompleted = document.getElementById("hideCompleted").checked;

        Meteor.call('getSpecificTrees', trees, hideCompleted, function(e, elements) {
            cydagre(cytoscape, dagre);

            let cy = cytoscape({
                container: $('#chart_div'),
                elements: elements,
                style: styleArr,

                layout: {
                    name: 'dagre',
                    rankDir: 'LR',
                    nodeSep: 10,
                    rankSep: 20,
                    padding:25,
                    fit: false
                }
            });

            cy.nodes().on('click', function () {
                if (this._private.classes.selected) {
                    this.removeClass('selected');
                } else {
                    this.addClass('selected');
                }
            });
        });
    }
});

/**
 * Returns the parent names
 */
Template.treeContainer.helpers({
    'treeParents': function(){
        $('select').material_select();
        return Template.instance().treeParents.get();
    }
});

let styleArr = [ // the stylesheet for the graph
    {
        selector: 'node',
        style: {
            'background-color': '#E57373',
            'label': 'data(name)',
            'width': 'label',
            'height': 'label',
            'text-halign': 'center',
            'text-valign': 'center',
            'color': '#fff',
            'shape': 'rectangle',
            'border-width': '0px',
            'shadow-blur': '6px',
            'shadow-offset-y': '2px',
            'shadow-opacity': '0.2',
            'padding-left': '5px',
            'padding-right': '5px',
            'padding-top': '5px',
            'padding-bottom': '5px',
            'font-size': '15'
        }
    },
    {
        selector: '.root',
        style: {
            'width': 'label',
            'height': 'label',
            'padding-left': '10px',
            'padding-right': '10px',
            'padding-top': '10px',
            'padding-bottom': '10px',
            'font-size': '20',
            'label': 'data(name)'
        }
    },
    {
        selector: '.complete',
        style: {
            'background-color': '#26a69a'
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'shadow-blur': '5px',
            'shadow-offset-y': '1px',
            'shadow-opacity': '0.2',
            'curve-style': 'straight'

        }
    }
];