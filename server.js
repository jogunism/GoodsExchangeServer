/**
 * ktmhow 결재중계서버
 * server.js
 * 
 * jogun on 2016. 02. 16.
 * Copyright © raize.com All rights reserved.
 **/

var express = require('express');
var errorHandler = require('errorhandler');
var bodyParser = require('body-parser');
var http = require('http')
var https = require('https');
var fs = require('fs');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : true }));
app.use(errorHandler({ log : errorHandling }));

var CORSDomains = ['http://local.leadme.today:8080', 'http://192.168.0.28:8080', 'https://raizegls.appspot.com'];

app.use(function(req, res, next) {

	var origin = req.header('Origin');

	if(CORSDomains.indexOf(origin) >= 0){
		res.header('Access-Control-Allow-Origin', origin);
	}

    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,LM-mode');
    next();
});

var prop = require('./properties');
var AEApiClient = require('./api_client/appengine');
var KTApiClient = require('./api_client/ktmhow');
var logger = require('./manager/logger');


///// utils ////////
var resSendToJson = function(res, obj) {
	if(obj && obj != undefined) {
		if(obj.hasOwnProperty('success') && !obj.success) {
			res.statusCode = 500;
		}
		res.set('Content-Type', 'application/json');
		res.send(obj);
	}
	res.end();
}

var errorHandling = function(err, str, req) {
	var _obj = {
		title : 'Error in '+ req.method + ' ' + req.url,
		message : str
	};
	logger.error(_obj);
// 	console.log(_obj);
}
//////////////

//
// restfull api
//
app.get('/products', function(req, res) {

	KTApiClient.getProducts()
		.then(function(arr) {
			resSendToJson(res, arr);
		})
		.catch(function(err) {
			resSendToJson(res, err);
		});
});

app.get('/available', function(req, res) {

	var _ctn = req.query.ctn;

	KTApiClient.verifyUser(_ctn)
		.then(function(result) {
			resSendToJson(res, result);
		})
		.catch(function(err) {
			resSendToJson(res, err);
		});
});

app.post('/order', function(req, res) {
	var _token = req.body.tr_id_token;
	var _userId = req.body.user_id;
	var _goodsId = req.body.goods_id;
	var _phoneNo = req.body.phone_no;

	var _trId = '';
	var _ctrId = '';

	KTApiClient.getProducts(_goodsId)
		.then(function(product){
			var _obj = {
				token : _token,
				userId : _userId, 
				goodsId : product.products.goods_id,
				goodsName : product.products.goods_nm,
				goodsPrice : product.products.total_price
			}
			return AEApiClient.verifyUser(_obj);
		})
		.then(function(data){
			_trId = data.tr_id;
			var _obj = {
				goodsId : _goodsId,
				phoneNo : _phoneNo,
				trId : _trId
			};
			return KTApiClient.order(_obj);
		})
		.then(function(result) {
// 			logger.info('결재 성공');

			_ctrId = result.value.ctr_id;
			return AEApiClient.sendResultSeccess(result);
		}, function(err) {

			if(_trId && _trId != '') { //결재실패
				var _obj = {
					tr_id : _trId,
					code : err.statCode || err.code,
					reason : err.reason
				}
				AEApiClient.sendResultFail();
			}

			//인증실패면 끝.
			resSendToJson(res, err);
		})
		.catch(function(err) {
// 			logger.warn('결재성공 > 피드백 실패');

			setTimeout(function() {
				KTApiClient.couponStatus(_trId)
					.then(function() {
						return KTApiClient.cancel(_trId);
					})
					.then(function(){
						logger.warn({ 
							'tr_id' : _trId, 
							'ctr_id' : _ctrId,
							'message' : 'mms 취소성공'
						});
					})
					.catch(function(err) {
						logger.error({
							'tr_id' : _trId, 
							'ctr_id' : _ctrId,
							'message' : 'mms 취소실패'
						});
					});
			}, prop.ktmhow.cancelRequestDelay);

			resSendToJson(res, err);
		})
		.then(function(){
// 			logger.info('결재 완료');
			resSendToJson(res, null);
		});

});

app.get('/cancel', function(req, res) {
	
	var _trId = req.query.tr_id;

	KTApiClient.couponStatus(_trId)
		.then(function() {
			return KTApiClient.cancel(_trId);
		})
		.then(function(){
			resSendToJson(res, null);
		})
		.catch(function(err) {
			resSendToJson(res, err);
		});

});

//////////////

var options = {
    key  : fs.readFileSync('cert/leadme.key'),
    cert : fs.readFileSync('cert/leadme.crt')
}

https.createServer(options, app).listen(prop.port, function() {

	var userVar = process.env.USER_VAR || 'real';

	prop.appengine.lmMode = userVar;

	if(userVar && userVar != undefined && userVar == 'local') {
		prop.appengine.domain = process.env.USER_DOMAIN;
	}

	if(	userVar && userVar != undefined && 
		(userVar == 'dev' || userVar == 'local') ) {
		prop.ktmhow.isDevMode = true;
	}
	else {
		prop.ktmhow.isDevMode = false;
	}

	console.log('-------------------------------');
	console.log(' Node start. ');
	console.log(' - kt_mhow devmode : '+ prop.ktmhow.isDevMode);
	console.log(' - LM-mode : '+ prop.appengine.lmMode);
	if(prop.appengine.lmMode == 'local') {
		console.log(' - local domain : '+ prop.appengine.domain);	
	}
	console.log('-------------------------------');

// 	logger.info('server start');

});
