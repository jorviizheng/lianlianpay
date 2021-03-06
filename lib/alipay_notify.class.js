/**
 * Created with JetBrains WebStorm.
 * User: dengdl
 * Date: 13-3-7
 * Time: 下午2:39
 * To change this template use File | Settings | File Templates.
 */

/* *
 * 类名：LLPay
 * 功能：支付宝通知处理类
 * 详细：处理支付宝各接口通知返回
 * 版本：3.2
 * 日期：2011-03-25
 * 说明：
 * 以下代码只是为了方便商户测试而提供的样例代码，商户可以根据自己网站的需要，按照技术文档编写,并非一定要使用该代码。
 * 该代码仅供学习和研究支付宝接口使用，只是提供一个参考

 *************************注意*************************
 * 调试通知返回时，可查看或改写log日志的写入TXT里的数据，来检查通知返回是否正常
 */

var core_funcs = require('./alipay_core.function');
var md5_f = require('./alipay_md5.function');

var inherits = require('util').inherits,
    EventEmitter = require('events').EventEmitter;


var config = require('../llpay.config.js');

function LLPay(alipay_config){
    EventEmitter.call(this);

    this.alipay_config = config;
    
    //config merge
    for(var key in alipay_config){
        this.alipay_config[key] = alipay_config[key];
    }
    // console.log("##alipay_config", this.alipay_config);

}

inherits(LLPay, EventEmitter);

    /**
     * 针对notify_url验证消息是否是连连支付发出的合法消息
     * @return 验证结果
     */
LLPay.prototype.verifyNotify = function(_POST, callback){
    var self = this;
    // console.log("verifyNotify22");
    if(Object.keys(_POST).length == 0) {//判断POST来的数组是否为空
        callback({err:'_POST is empty'});
        return false;
    }else {
        if(_POST['oid_partner'] != _POST['oid_partner'])
            return callback({code:-1, msg:"partner not equal"});
        console.log("verifyNotify _POST", _POST);
        //生成签名结果
        var isSign = self.getSignVeryfy( _POST, _POST["sign"],false);
        var trade_no =_POST["no_order"]
	var money_order = parseFloat(_POST["money_order"])
        if(callback)
            return callback(null,trade_no, money_order, isSign, "llpay");                  
        else{            
            console.log("emit trade_no", trade_no);
            self.emit('send_goods_confirm_by_platform_success', trade_no, money_order , isSign, "llpay");            
        }
    }
}

    /**
     * 针对return_url验证消息是否是连连支付发出的合法消息
     * @return 验证结果
     */

//modify by navy for anync to veridy
LLPay.prototype.verifyReturn = function(_POST,cbf){
    // console.log("verifyReturn22");
    if(Object.keys(_POST).length == 0) {//判断GET来的数组是否为空
        return cbf(null, false);
         
    }
    else{
        if(_POST['oid_partner'] != _POST['oid_partner'])
            return cbf({code:-1, msg:"partner not equal"});
        //生成签名结果 true or false
        var isSign = this.getSignVeryfy(_POST, _POST["sign"], true);
        return cbf(null, isSign);    
    }
}

/**
 * 获取返回时的签名验证结果
 * @param para_temp 通知返回来的参数数组
 * @param sign 返回的签名结果
 * @return 签名验证结果
 */
LLPay.prototype.getSignVeryfy = function(para_temp, sign, sort){
    // console.log("getSignVeryfy ======= para_temp ", para_temp);
    // console.log("getSignVeryfy ======= sign ", sign);
    //除去待签名参数数组中的空值和签名参数
    var para_filter = core_funcs.paraFilter(para_temp);
    // console.log("getSignVeryfy ======= para_filter ", para_filter);
    //对待签名参数数组排序
    if(sort)
    {
        para_filter = core_funcs.argSort(para_filter);
    }

    //把数组所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
    var prestr = core_funcs.createLinkstring(para_filter);
    // console.log("getSignVeryfy ======= prestr ", prestr);

    var isSgin = false;
    console.log(" this.alipay_config## ", this.alipay_config);
    console.log(" sign_type ", this.alipay_config.sign_type);
    var sign_type = this.alipay_config['sign_type'].trim().toUpperCase();    
    // console.log('sign_type:', sign_type);
    if(sign_type == "MD5"){
        // console.log('prestr:', prestr);
        // console.log ("key:",this.alipay_config['key']);
        isSgin = md5_f.md5Verify(prestr, sign, this.alipay_config['key']);
    }
    else{
        isSgin = false;
    }
    return isSgin;
}

LLPay.prototype.verify_my = function(notify_id, callback){
}
/**
 * 获取远程服务器ATN结果,验证返回URL
 * @param notify_id 通知校验ID
 * @return 服务器ATN结果
 * 验证结果集：
 * invalid命令参数不对 出现这个错误，请检测返回处理中partner和key是否为空
 * true 返回正确信息
 * false 请检查防火墙或者是服务器阻止端口问题以及验证时间是否超过一分钟
 */
LLPay.prototype.getResponse = function(notify_id, callback){
    var transport = this.alipay_config['transport'].trim().toLowerCase();
    var partner = this.alipay_config['partner'].trim();
    var veryfy_url = '';
    if(transport == 'https') {
        veryfy_url = this.https_verify_url;
    }
    else {
        veryfy_url = this.http_verify_url;
    }
    veryfy_url = veryfy_url + "partner=" + partner +  "&notify_id=" + notify_id;
    console.log('#######veryfy_url:', veryfy_url);
    core_funcs.getHttpResponseGET(veryfy_url, this.alipay_config['cacert'], callback);    

}
Object.defineProperty(LLPay, "wapllpay", {
  get: function () {
    return require('wapllpay');
  }
});
exports.LLPay = LLPay;
