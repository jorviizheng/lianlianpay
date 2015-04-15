
var returnData = {
"ret_code":"0000",
"ret_msg":"交易成功",
"oid_partner":"201103171000000000",
"dt_order":"20130515094013",
"no_order":"2013051500001",
"oid_paybill":"2013051613121201",
"money_order":"210.97",
"result_pay":"SUCCESS",
"settle_date":"20130516", 
"info_order":"用户13958069593购买了3桶羽毛球",
"sign_type":"MD5", 
"sign":"e939b2ac00f7bbedd47d77df6c675d69"
// "sign_type":"RSA", 
// "sign":"ZPZULntRpJwFmGNIVKwjLEF2Tze7bqs60rxQ22CqT5J1UlvGo575QK9z/ +p+7E9cOoRoWzqR6xHZ6WVv3dloyGKDR0btvrdqPgUAoeaX/YOWzTh00vwcQ+HBtX E+vPTfAqjCTxiiSJEOY7ATCF1q7iP3sfQxhS0nDUug1LP3OLk="
};
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

var verify = require('../lib/alipay_notify.class');
var config = require('../llpay.config');
var v = new verify.AlipayNotify(config.Config);
v.verifyReturn(returnData, function(err, result) {
	console.log("verifyReturn result:",err, result);
	// body...
});
v.verifyNotify(notifyData, function(err, result) {
	console.log("verifyNotify result:",err, result);
	// body...
});