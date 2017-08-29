/**
 * ktmhow 결재중계서버
 * server.js
 * 
 * jogun on 2016. 02. 16.
 * Copyright © raize.com All rights reserved.
 **/

// 3rd-party module
var express 		= require('express');
var bodyParser 		= require('body-parser');
var fs 				= require('fs');
var http 			= require('http');
var https 			= require('https');

// in-house module
var prop 			= require('./properties');
var constants 		= require('./constants');
var AEApiClient 	= require('./api_client/appengine');
var KTApiClient 	= require('./api_client/ktmhow');
var logger 			= require('./manager/logger');
var url 			= require('./manager/url');

/**
 *	환경변수 참조해서 시스템 런타임 프로퍼티 설정
 *
 */
var isTest = process.argv.length > 2;
var serverPhase = isTest? constants.SERVER_PHASE_DEV : process.env.KTM_SERVER_PHASE || constants.SERVER_PHASE_REAL;

prop.appengine.lmMode = serverPhase;
prop.appengine.domain = process.env.LM_SERVER_DOMAIN;
prop.ktmhow.isDevMode = (serverPhase == constants.SERVER_PHASE_DEV || serverPhase == constants.SERVER_PHASE_LOCAL)

// 환경변수 영향을 받는 URLManager 초기화
url.init();

//
// restfull api
//
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

/**
 * Express 웹 어플리케이션 생성
 * 미들웨어 설정
 * 라우팅 핸들러 설정
 *
 */

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : true }));
app.use(function(req, res, next) {

	var origin = req.header('Origin');

	if(prop.cors.domains.indexOf(origin) >= 0){
		res.header('Access-Control-Allow-Origin', origin);
	}

    res.header('Access-Control-Allow-Methods', prop.cors.method);
    res.header('Access-Control-Allow-Headers', prop.cors.header);
    next();
});


app.get('/products', function(req, res) {

	KTApiClient.getProducts('default')
		.then(function(arr) {
			resSendToJson(res, arr);
		})
		.catch(function(err) {
			resSendToJson(res, err);
		});
});

app.get('/products2', function(req, res) {

	KTApiClient.getProducts('expanded')
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
	var _type = req.body.type || 'default';
	var _token = req.body.tr_id_token;
	var _userId = req.body.user_id;
	var _goodsId = req.body.goods_id;
	var _phoneNo = req.body.phone_no;

	var _trId = '';
	var _ctrId = '';

	KTApiClient.getProducts(_type, _goodsId)
		.then(function(product){
			var _obj = {
				token : _token,
				userId : _userId, 
				goodsId : product.products.goods_id,
				goodsName : product.products.goods_nm,
				goodsPrice : product.products.total_price || product.products.real_price
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
				AEApiClient.sendResultFail(_obj);
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
var server;
var port = isTest? 9391 : prop.port;

if(serverPhase == constants.SERVER_PHASE_LOCAL){

	server = http.createServer(app);
}else{

	try{
		server = https.createServer({
			    key  : fs.readFileSync('cert/leadme.key'),
			    cert : fs.readFileSync('cert/leadme.crt')
			}, app);
	}catch(e){

		// Maybe Local
		server = http.createServer(app);
	}
}

server.listen(port, function() {

	console.log('-------------------------------');
	console.log(' Node start. ');
	console.log(' - port : '+ port);
	console.log(' - kt_mhow devmode : '+ prop.ktmhow.isDevMode);
	console.log(' - LM-mode : '+ prop.appengine.lmMode);
	console.log(' - LM-domain : '+ url.AEVerifyUser());	
	console.log('-------------------------------');

// 	logger.info('server start');

});
