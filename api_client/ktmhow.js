/**
 * ktmhow.js
 * 
 * jogun on 2016. 02. 16.
 * Copyright © raize.com All rights reserved.
 **/

var Promise = require('bluebird');
var request = require('request');
var xmlParser = require('xml2js').parseString;

var prop = require('../properties');
var url = require('../manager/url');
var logger = require('../manager/logger');


var ktmhowApiClient = function() {
	
	var BASE_URL = function(url) {
		return url + '?MDCODE=' + prop.ktmhow.mdCode;
	}

	var verifyUser = function(ctn) {

		return new Promise(function(resolve, reject) {
		
			var _url = BASE_URL(url.KTCheckUser()) + '&ctn=' + ctn;
			
			request(_url, function(error, response, body){

				if(error || response.statusCode != 200) {
					reject({'success' : false, 
							'method' : 'verifyUser', 
							'type' : 'http', 'statCode' : response.statusCode, 'reason' : response.statusMessage });
					return;
				}

				xmlParser(body, {explicitArray : false}, function(err, result) {
					
					var _statCode = result.response.result.code;

					if(_statCode == 0) {
						resolve();
					}
					else {

						var _obj = result.response.result;
						reject({'success' : false, 
								'method' : 'verifyUser', 
								'type' : 'ktmhow', 'statCode' : parseInt(_obj.code), 'reason' : _obj.reason });
					}

				});

			});

		});

	}

	var getProducts = function(goodsId) {
		
		return new Promise(function(resolve, reject) {
		
			var _url = BASE_URL(url.KTSaleList());
			if(goodsId && goodsId != '')
				_url += '&goods_id=' + goodsId;

			request(_url, function(error, response, body){

				if(error || response.statusCode != 200) {
					reject({'success' : false, 
							'method' : 'getProducts', 
							'type' : 'http', 'statCode' : response.statusCode, 'reason' : response.statusMessage });
					return;
				}

				xmlParser(body, {explicitArray : false}, function(err, obj) {

					var _statCode = obj.response.result.code;

					if(_statCode == 0) {	//success
						resolve({'count' : parseInt(obj.response.result.goodsnum), 
								 'products' : obj.response.value.goodslist });
					} 
					else {					//fail
						var _obj = obj.response.result;
						reject({'success' : false, 'code' : 'LM50',
								'method' : 'getProducts', 
								'type' : 'ktmhow', 'statCode' : parseInt(_obj.code),  'reason' : _obj.reason });
					}

				});

			});

		});
	};
	
	var order = function(obj) {

		return new Promise(function(resolve, reject) { 

			var _url = BASE_URL(url.KTOrder()) + 
						'&MSG=' + prop.ktmhow.senderInfo.body + 
						'&TITLE=' + prop.ktmhow.senderInfo.title + 
						'&CALLBACK=' + prop.ktmhow.senderInfo.phoneNo + 
						'&goods_id=' + obj.goodsId + 
						'&phone_no=' + obj.phoneNo + 
						'&tr_id=' + obj.trId;

			request(_url, function(error, response, body){

				if(error || response.statusCode != 200) {
					reject({'success' : false, 
							'method' : 'order', 
							'type' : 'http', 'statCode' : response.statusCode, 'reason' : response.statusMessage });
					return;
				}

				xmlParser(body, {explicitArray : false}, function(err, result) {

					var _statCode = parseInt(result.response.result.code);

					if(_statCode == 1000) {	//success
						resolve({'success' : true, 'value' : result.response.value });
					}
					else {					//fail
						var _obj = result.response.result;
						reject({'success' : false, 'code' : 'LM53',
								'method' : "order", 
								'type' : 'ktmhow', 'statCode' : parseInt(_obj.code), 'reason' : _obj.reason });
					}
				});
				
			});

		});

	};

	var couponStatus = function(trId) {

		return new Promise(function(resolve, reject) {

			var _url = BASE_URL(url.KTCouponStatus()) + '&tr_id='+ trId;

			request(_url, function(error, response, body) {

				if(error || response.statusCode != 200) {
					reject({'success' : false, 
							'method' : 'couponStatus', 
							'type' : 'http', 
							'statCode' : response.statusCode, 
							'reason' : response.statusMessage });
					return;
				}

				xmlParser(body, {explicitArray : false}, function(err, result) {

					var _statCode = result.response.result.StatusCode;

					if(_statCode == 0) {	//success
						resolve();
					}
					else {					//fail
						var _obj = result.response.result;
						reject({'success' : false,
								'method' : "couponStatus", 
								'type' : 'ktmhow', 
								'statCode' : parseInt(_obj.StatusCode), 
								'reason' : _obj.StatusText });
					}

				});
				
			});
			
		});
		
	};

	var cancel = function(trId) {
		
		return new Promise(function(resolve, reject) {
			
			var _url = BASE_URL(url.KTCancel()) + '&tr_id='+ trId;

			request(_url, function(error, response, body){

				if(error || response.statusCode != 200) {
					reject({'success' : false, 
							'method' : 'cancel', 
							'type' : 'http', 'statCode' : response.statusCode, 'reason' : response.statusMessage });
					return;
				}

				xmlParser(body, {explicitArray : false}, function(err, result) {

					var _statCode = result.response.result.StatusCode;
					
					if(_statCode == 0) {	//success
						resolve();
					}
					else {
						var _obj = result.response.result;
						reject({'success' : false, 'code' : 'LM53',
								'method' : "cancel", 
								'type' : 'ktmhow', 'statCode' : parseInt(_obj.StatusCode), 'reason' : _obj.StatusText });
					}
					
				});

			});
			
		});
	
	};

	return {
		verifyUser : verifyUser,
		getProducts : getProducts, 
		order : order, 
		couponStatus : couponStatus,
		cancel : cancel
	}
}

module.exports = new ktmhowApiClient();

