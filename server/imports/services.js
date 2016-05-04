import { Meteor } from 'meteor/meteor';

let initServices = function(){
    ServiceConfiguration.configurations.remove({
        service: 'facebook'
    });
    ServiceConfiguration.configurations.insert({
        service: 'facebook',
        appId: Meteor.settings.fbAppId,
        secret: Meteor.settings.fbSecret
    });
};

export { initServices };