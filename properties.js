/**
 * properties.js
 * 
 * jogun on 2016. 02. 16.
 * Copyright © raize.com All rights reserved.
 **/
 
var obj = {

	port : 9390,

	logger : {
		projectId : 'raizegls',
		name : 'raize-log',
		resource : {
			type : 'gce_instance',
			instanceId : 'raizegls-node',
			zone : 'asia-east1-a'
		}
	},

	ktmhow : {
		isDevMode : process.env.USER_VAR == 'dev' || process.env.USER_VAR == 'local' ? true : false,
		mdCode : 'leadme',
		senderInfo : {
			title : '제목',
			body : '내용',
			phoneNo : '070-4117-5323'
		}, 
		cancelRequestDelay : 3000
	}, 

	appengine : {
		lmMode : '',
		domain : '',
		verifyType : 'giftishow'
	}
 };

module.exports = {
	port : obj.port, 
	logger : obj.logger,
	ktmhow : obj.ktmhow,
	appengine : obj.appengine
 };
 