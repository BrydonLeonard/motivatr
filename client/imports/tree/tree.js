import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';
import cytoscape from './../imports/cytoscape'; //Until the failed to parse sourcemap bug is fixed, we load this ourselves
import './tree.html';
import './../desktop/jqtree.css';

Template.treeContainer.onRendered(function(){
    Tracker.autorun(function(){
        Meteor.call('visTreeData', function(elements) {
            console.log('made it?');
            console.log(elements);
            let cy = cytoscape({
                container:document.getElementById('chart_div'),
                elements:elements,
                zoom:'2',
                style: [ // the stylesheet for the graph
                    {
                        selector: 'node',
                        style: {
                            'background-color': '#26a69a',
                            'label':'data(id)',
                            'width':'label',
                            'height':'label',
                            'text-halign':'center',
                            'text-valign':'center',
                            'color': '#fff',
                            'shape': 'rectangle',
                            'border-width':'0px',
                            'shadow-blur':'6px',
                            'shadow-offset-y':'2px',
                            'shadow-opacity':'0.2',
                            'padding-left':'5px',
                            'padding-right':'5px',
                            'padding-top':'5px',
                            'padding-bottom':'5px',
                            'font-size':'15'
                        }
                    },
                    {
                        selector:'.complete',
                        style:{
                            'background-color':'#76ff03',
                            'color':'#000'
                        }
                    },
                    {
                        selector:'.root',
                        style:{
                            'width':'label',
                            'height':'label',
                            'padding-left':'10px',
                            'padding-right':'10px',
                            'padding-top':'10px',
                            'padding-bottom':'10px',
                            'font-size':'20',
                            'label': 'data(myText)'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 3,
                            'line-color': '#ccc',
                            'target-arrow-color': '#ccc',
                            'target-arrow-shape': 'triangle',
                            'shadow-blur':'5px',
                            'shadow-offset-y':'1px',
                            'shadow-opacity':'0.2',
                            'curve-style':'straight'

                        }
                    }
                ],

                layout: {
                    name: 'cose',
                    'edgeElasticity':function(edge){
                        if (edge.source().id() == "Root")
                            return 300;
                        return 100;
                    }
                }
            });

            cy.nodes().on('click', function(){
                if (this._private.classes.selected){
                    this.removeClass('selected');
                } else {
                    this.addClass('selected');
                }
            });
        });
    });
});
