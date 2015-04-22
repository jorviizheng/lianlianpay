var notifyData =
{
"oid_partner":"201103171000000000",
"dt_order":"20130515094013",
"no_order":"2013051500001",
"oid_paybill":"2013051613121201",
"money_order":"210.97",
"result_pay":"SUCCESS",
"settle_date":"20130516", "info_order":"用户13958069593购买了3桶羽毛球",
"pay_type":"2",
"bank_code":"01020000",
"sign_type":"MD5", 
"sign":"fef314c181d75d41259841e4d2849285"
// "sign_type":"RSA", 
// "sign":"ZPZULntRpJwFmGNIVKwjLEF2Tze7bqs60rxQ22CqT5J1UlvGo575QK9z/ +p+7E9cOoRoWzqR6xHZ6WVv3dloyGKDR0btvrdqPgUAoeaX/YOWzTh00vwcQ+HBtX E+vPTfAqjCTxiiSJEOY7ATCF1q7iP3sfQxhS0nDUug1LP3OLk="
}
var EventEmitter = require('events').EventEmitter;
var verify = require('../lib/alipay_notify.class');
var config = require('../llpay.config');
console.log("config:",config);
var v = new verify.LLPay(config);
describe('verify', function(){	
	it('verify notify data event', function(done){
		
		v.on('send_goods_confirm_by_platform_success', function(trade_no, status, payment_method){
			console.log("on event ", trade_no, status);
			if(status)
				done();
			else
				done(trade_no);
		});
		v.verifyNotify(notifyData);

	});	
});
