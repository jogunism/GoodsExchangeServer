/**
 * appengine.js
 * 
 * jogun on 2016. 02. 16.
 * Copyright © raize.com All rights reserved.
 **/

var Promise = require('bluebird');
var request = require('request');

var prop = require('../properties');
var url = require('../manager/url');
var logger = require('../manager/logger');

var AppEngineApiClient = function() {

	var verifyUser = function(obj) {

		return new Promise(function(resolve, reject) {

			request({
				method : 'PUT',
				url : url.AEVerifyUser(),
				form : {
					'type' : prop.appengine.verifyType,
					'tr_id_key' : obj.token,
					'user_id' : obj.userId, 
					'goods_id' : obj.goodsId, 
					'goods_name' : obj.goodsName, 
					'goods_price' : obj.goodsPrice
				}
			}, function(error, response, body) {

				if(error || response.statusCode != 200) {

					try {
						var _obj = JSON.parse(body);

						reject({'success' : false, 
							'trId' : obj.tr_id,
							'method' : 'verifyUser', 
							'type' : 'appengine', 
							'code' : _obj.code, 
							'reason' : _obj.message });

					} catch(e) {
	
						reject({'success' : false, 
								'trId' : obj.value.tr_id, 
								'method' : 'verifyUser', 
								'type' : 'http', 
								'code' : response.statusCode, 
								'reason' : response.statusMessage });
					}
				}
				else {
					var _obj = JSON.parse(body);
					resolve({ 'success' : true, 'tr_id' : _obj.tr_id });
				}
			});

		});
	}

	var sendResultSeccess = function(obj) {

		return new Promise(function(resolve, reject) {

			request({
				method : 'PUT',
				url : url.AESendResult() + obj.value.tr_id,
				form : {
					mdn : obj.value.mdn,
					ctr_id : obj.value.ctr_id
				}
			}, function(error, response, body){

				if(error || response.statusCode != 204) {

					try {
						var _obj = JSON.parse(body);

						reject({'success' : false, 
							'trId' : obj.value.tr_id,
							'method' : 'sendResultSeccess', 
							'type' : 'appengine', 
							'code' : _obj.code, 
							'reason' : _obj.message });
					
					} catch(e) {
	
						reject({'success' : false, 
								'trId' : obj.value.tr_id, 
								'method' : 'sendResultSeccess', 
								'type' : 'http', 
								'code' : response.statusCode, 
								'reason' : response.statusMessage });
					}

					return;
				}
				else {
					resolve();
				}

			});
		});

	}
	
	var sendResultFail = function(obj) {
console.log('sendResultFail');
console.log(obj);
		return new Promise(function(resolve, reject) {

			request({
				method : 'DELETE',
				url : url.AESendResult() + obj.tr_id,
				form : {
					err_code : obj.statCode,
					err_reason : obj.reason
				}
			}, function(error, response, body){

				if(error || response.statusCode != 204) {

					try {
						var _obj = JSON.parse(body);

						reject({'success' : false, 
							'trId' : obj.tr_id,
							'method' : 'sendResultSeccess', 
							'type' : 'appengine', 
							'code' : _obj.code, 
							'reason' : _obj.message });
					
					} catch(e) {
	
						reject({'success' : false, 
								'trId' : obj.tr_id, 
								'method' : 'sendResultSeccess', 
								'type' : 'http', 
								'code' : response.statusCode, 
								'reason' : response.statusMessage });
					}

					return;
				}
				else {
					resolve();
				}
			});

		});

	}

	return {
		verifyUser : verifyUser, 
		sendResultSeccess : sendResultSeccess,
		sendResultFail : sendResultFail
	}
}

module.exports = new AppEngineApiClient();
