import { Meteor } from 'meteor/meteor';
import './analytics.html';
import Chart from 'chart.js';

let chart;
let ctx;

Template.analytics.onRendered(function(){
    ctx = $('#levelChart');
    Meteor.call('analyticsLevelData', function(e, result) {
        let labels = Object.keys(result);
        labels.sort();
        let datasetData = [];
        for (let i of labels){
            datasetData.push(result[i]);
        }

        let data = {
            labels,
            datasets: [{
                label:'Node depth frequency',
                backgroundColor: "rgba(255,255,255,0.2)",
                borderColor: "rgba(255,255,255,0.7)",
                borderWidth: 1,
                hoverBackgroundColor: "rgba(255,255,255,0.5)",
                hoverBorderColor: "rgba(255,255,255,0.7)",
                data: datasetData
            }]
        }

        Chart.defaults.global.defaultFontColor = '#ffffff';

        chart = new Chart(ctx, {
            type: 'bar',
            data,
            options: {
                scales: {
                    yAxes: [{
                        stacked: true
                    }]
                }
            }
        });
    });
});

Template.analytics.helpers({
    numSplits:function(){
        return Meteor.user().profile.split;
    }
});