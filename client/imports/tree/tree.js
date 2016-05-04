import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';
import { $ } from 'meteor/jquery';
//import  { cytoscape } from 'cytoscape'; // Until the failed to parse sourcemap bug is fixed, we load this ourselves
let cytoscape = require('./cytoscape.js');
import './tree.html';


/**
 * When the treeContainer template is rendered, get the data from the server and display it
 */
Template.treeContainer.onRendered(function(){
    Meteor.call('visTreeData', function(e, elements) {
        let cy = cytoscape({
            container: $('#chart_div'),
            elements: elements,
            style: [ // the stylesheet for the graph
                {
                    selector: 'node',
                    style: {
                        'background-color': '#26a69a',
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
            ],

            layout: {
                name: 'cose',
                'edgeElasticity': function (edge) {
                    if (edge.source().id() == 'root')
                        return 300;
                    return 100;
                }
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
