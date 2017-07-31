/**
 * logger.js
 * 
 * jogun on 2016. 02. 19.
 * Copyright © raize.com All rights reserved.
 **/

var prop = require('../properties');
var gcloud = require('gcloud')({
	projectId: prop.logger.projectId
});

var logManager = (function(){

	var logging = gcloud.logging();
	var log = logging.log(prop.logger.name);

	var resource = {
		type: prop.logger.resource.type,
		labels: {
			instance_id: prop.logger.resource.instanceId,
			zone: prop.logger.resource.zone
		}
	};

	return {
		write: function(obj) {
			var entry = log.entry(resource, obj);

			log.write([entry], function(err, apiResponse){
			});
		}
	}
})();

module.exports = {

	trace: function(msg) {
		return logManager.write({'trace' : msg});
	}, 
	
	debug: function(msg) {
		return logManager.write({'debug' : msg});
	}, 
	
	info: function(msg) {
		return logManager.write({'info' : msg});
	}, 
	
	warn: function(msg) {
		return logManager.write({'warn' : msg});
	}, 
	
	error: function(msg) {
		return logManager.write({'error' : msg});
	}, 
	
	fatal: function(msg) {
		return logManager.write({'fatal' : msg});
	}
};