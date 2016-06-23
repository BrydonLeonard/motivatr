import { analytics } from './../../shared/imports/dbSetup';
import moment from 'moment';

/**
 * Register the addition of nodes
 * @param userId The user that added nodes
 * @param numNodes The number of nodes added (Optional)
 */
let nodeAdded = function(userId, numNodes){
    numNodes = numNodes || 1;
    analytics.insert({
        user: userId,
        type: 'add',
        time: moment().unix(),
        num: numNodes
    });
};

/**
 * Register the removal of nodes
 * @param userId The user that removed nodes
 * @param numNodes The number of nodes removed (Optional)
 */
let nodeRemoved = function(userId, numNodes){
    numNodes = numNodes || 1;
    analytics.insert({
        user: userId,
        type: 'remove',
        time: moment().unix(),
        num: numNodes
    });
};

export { nodeAdded, nodeRemoved };