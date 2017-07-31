/**
 * url.js
 * 
 * jogun on 2016. 02. 16.
 * Copyright © raize.com All rights reserved.
 **/

var prop = require('../properties');

var urlManager = (function(){

	return {

		ktmhowGetSaleList : function() {
			if(prop.ktmhow.isDevMode) {
				return 'http://tgiftishowgw.giftishow.co.kr/media/salelist.asp';
			}
			else {
				return 'https://giftishowgw.giftishow.co.kr/media/salelist.asp';
			}
		},

		ktmhowUserAuth : function() {
			if(prop.ktmhow.isDevMode) {
				return 'http://tgiftishowgw.giftishow.co.kr/media/Auth.asp';
			}
			else {
				return 'https://giftishowgw.giftishow.co.kr/media/Auth.asp';
			}
		},

		ktmhowOrderRequest : function() {
		 	if(prop.ktmhow.isDevMode) {
				return 'http://tgiftishowgw.giftishow.co.kr/media/request.asp';
			}
			else {
				return 'https://giftishowgw.giftishow.co.kr/media/request.asp';
			}
		}, 
		
		ktmhowCouponStatus : function() {
		 	if(prop.ktmhow.isDevMode) {
				return 'http://tgiftishowgw.giftishow.co.kr/media/coupon_status.asp';
			}
			else {
				return 'http://giftishowgw.giftishow.co.kr/media/coupon_status.asp';
			}
		},
		
		ktmhowCancelRequest : function() {
		 	if(prop.ktmhow.isDevMode) {
				return 'http://tgiftishowgw.giftishow.co.kr/media/coupon_cancel.asp';
			}
			else {
				return 'https://giftishowgw.giftishow.co.kr/media/coupon_cancel.asp';
			}
		}, 

		appengineDomain : function() {
			if(prop.appengine.lmMode == 'local') {
				return prop.appengine.domain;
			}
			else if(prop.appengine.lmMode == 'dev') {
				return 'https://raizegls.appspot.com';
			}
			else if(prop.appengine.lmMode == 'staging') {
				return 'https://raziegle.appspot.com';//'https://rz-staging-dot-kinetic-mile-95704.appspot.com';
			}
			else {
				return 'http://www.leadme.today';
			}
		},

		appengineUserVerification : function() {
			return this.appengineDomain() + '/api/exchange/transaction';
		},

		appengineSendResult : function() {
			return this.appengineDomain() + '/api/exchange/transaction/';
		}

	 }
})();

module.exports = {

	KTSaleList : urlManager.ktmhowGetSaleList,
	KTCheckUser : urlManager.ktmhowUserAuth,
	KTOrder : urlManager.ktmhowOrderRequest, 
	KTCancel : urlManager.ktmhowCancelRequest,
	KTCouponStatus : urlManager.ktmhowCouponStatus,

	AEVerifyUser : function(){
		// appengineUserVerification 함수에서 this 참조가 module 자체로 변경되기 때문에 익명함수로 Wrapping
		return urlManager.appengineUserVerification();
	},

	AESendResult : function(){
		return urlManager.appengineSendResult();
	}
};
