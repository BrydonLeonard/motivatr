import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';
import cytoscape from './imports/cytoscape'; //Until the failed to parse sourcemap bug is fixed, we load this ourselves

Template.treeContainer.onRendered(function(){
    Tracker.autorun(function(){
        getData(function(elements){
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
                        selector:'.green',
                        style:{
                            'background-color':'#76ff03',
                            'color':'#000',
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
                        selector: '.selected',
                        style: {
                            'label':'data(id)',
                            'height': 'label',
                            'width': 'label'
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


let dupNumAdder = function(s, n){
    return s + ' (' + String(n) + ')'
}

let getData = function(callback){
    let arr = [];
    taken = [];
    let items = itemCollection.find({level:0}).fetch();
    for (var i = 0; i < items.length; i++){
        let name = items[i].name;
        if (name.length > 20){
            name = name.split().slice(0,20).join();
        }
        if (taken.indexOf(name) > -1){
            let num = 1;
            if (taken.indexOf(dupNumAdder(items[i].name,num)) > -1){
                num++;
            } else {
                name = dupNumAdder(items[i].name,num);
            }
        }
        arr.push({data:{id:name, myParent:null, myText:name}, classes:((completePerc(items[i]._id) == 1)?'green ':'') + 'root'});
        taken.push(name);
        for (var item of recGetChildren(items[i]._id, items[i].name)){
            if (item.data.id.length > 20){
                item.data.id = item.data.id.split().slice(0,20).join();
            }
            if (taken.indexOf(item.data.id) > -1){
                let num = 1;
                if (taken.indexOf(dupNumAdder(item.data.id,num)) > -1){
                    num++;
                } else {
                    item.data.id = dupNumAdder(item.data.id,num);
                }
            }
            arr.push(item);
            taken.push(item.data.id);
        }
    }
    let edges = [];
    let edgeCount = 0;

    temp = [];
    for (var item of arr){
        if (item.data.myParent != null){
            edges.push({data:{id:'edgeId' + String(edgeCount++), target:item.data.id, source:item.data.myParent}});
            temp.push([item.data.id, item.data.myParent]);
        }
    }
    arr = arr.concat(edges);
    callback(arr);
};

let recGetChildren = function(_id, parentName){
    let arr = [];
    let items = itemCollection.find({parent:_id}).fetch();
    for (var i = 0; i < items.length; i++){
        arr.push({data:{id:items[i].name, myParent:parentName}, classes:(completePerc(items[i]._id) == 1)?'green':''});
        arr = arr.concat(recGetChildren(items[i]._id, items[i].name));
    }
    return arr;
};