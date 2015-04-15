var AlipayNotify = require('./alipay_notify.class').AlipayNotify;    
var AlipaySubmit = require('./alipay_submit.class').AlipaySubmit;
var  assert = require('assert');
var url = require('url');
var inherits = require('util').inherits,
    EventEmitter = require('events').EventEmitter;
    
var DOMParser = require('xmldom').DOMParser;
var dateUtil = require('./util');
var logger = require('log4js').getLogger(__filename);
var xml2js = require("xml2js");

var default_alipay_config = require("../llpay.config");
            
function Alipay(alipay_config){     
    EventEmitter.call(this);
    
    //default config
    this.alipay_config = default_alipay_config;
    //config merge    
    for(var key in alipay_config){

        this.alipay_config[key] = alipay_config[key];
    }       
}

/**
 * @ignore
 */
inherits(Alipay, EventEmitter);

Alipay.prototype.route = function(app){
    var self = this;
    app.get(this.alipay_config.create_direct_pay_by_user_return_url, function(req, res){self.create_direct_pay_by_user_return(req, res)});
    app.post(this.alipay_config.create_direct_pay_by_user_notify_url, function(req, res){self.create_direct_pay_by_user_notify(req, res)});
    app.post(this.alipay_config.refund_fastpay_by_platform_pwd_notify_url, function(req, res){self.refund_fastpay_by_platform_pwd_notify(req, res)});

    app.get(this.alipay_config.create_partner_trade_by_buyer_return_url, function(req, res){self.create_partner_trade_by_buyer_return(req, res)});
    app.post(this.alipay_config.create_partner_trade_by_buyer_notify_url, function(req, res){self.create_partner_trade_by_buyer_notify(req, res)});
    
    app.get(this.alipay_config.trade_create_by_buyer_return_url, function(req, res){self.trade_create_by_buyer_return(req, res)});
    app.post(this.alipay_config.trade_create_by_buyer_notify_url, function(req, res){self.trade_create_by_buyer_notify(req, res)});
}
//get auth
//alipay.wap.trade.create.direct
Alipay.prototype.wap_trade_create_direct = function(data, res){
    self = this;
    // console.log('data:');
    // console.log(data);
    // assert.ok(data.out_trade_no && data.subject && data.total_fee);
    console.log(data.out_trade_no , data.subject , data.total_fee);
    assert.ok( data.subject && data.total_fee);
    //返回格式
    var format = 'xml';
    //version
    // var v = '2.0';
    var v = '1.0';
    //请求号
    var req_id = dateUtil.date('YmdHis');//may be bug
    //req_id="2";
    //服务器异步通知页面路径
    var notify_url = url.resolve(this.alipay_config.host, this.alipay_config.create_direct_pay_by_user_notify_url);
    //页面跳转同步通知页面路径
    var call_back_url = url.resolve(this.alipay_config.host , this.alipay_config.create_direct_pay_by_user_return_url);
    //卖家支付宝帐户
    var seller_email = this.alipay_config.seller_email;
    //商户订单号
    var out_trade_no = data.out_trade_no;
    
    //订单名称
    var subject = data.subject;
    subject = 'chaobaidaCTM';
    //付款金额
    var total_fee = data.total_fee;
    
    //var out_user = 1234567989;
    //var merchant_url = 'http://www.chaobaida.com';
    var pay_expire = 86400;
    ////console.log("notify_url = ",notify_url);
   // //console.log("callback_url = ",call_back_url);

    //请求业务参数详细
    var req_data = '<direct_trade_create_req><subject>' + subject + '</subject><out_trade_no>' + out_trade_no + '</out_trade_no><total_fee>' + total_fee + '</total_fee><seller_account_name>' + seller_email + '</seller_account_name><call_back_url>' + call_back_url + '</call_back_url><notify_url>' + notify_url + '</notify_url><pay_expire>' + pay_expire + '</pay_expire></direct_trade_create_req>';   
    // req_data='<direct_trade_create_req><notify_url>http://localhost:3000/alipay/create_direct_pay_by_user/notify_url</notify_url><call_back_url>http://localhost:3000/alipay/create_direct_pay_by_user/return_url</call_back_url><seller_account_name>'+seller_email+'</seller_account_name><out_trade_no>111111</out_trade_no><subject>aaaaaa</subject><total_fee>0.01</total_fee></direct_trade_create_req>';
    //console.log('req_data= ',req_data);
    //构造要请求的参数数组，无需改动
    var parameter = {
        "service":"alipay.wap.trade.create.direct"
        ,"partner":this.alipay_config.partner       
        ,"sec_id":this.alipay_config.sign_type
        ,"format":format
        ,"v":v
        ,"req_id":req_id
        ,"req_data":req_data
        ,"_input_charset":this.alipay_config.input_charset
    };


    //建立请求
    this.alipay_config.gateway = 'http://wappaygw.alipay.com/service/rest.htm?';
    var alipaySubmit = new AlipaySubmit(this.alipay_config);
    console.log('================before submit to auth ');
    console.log(parameter);
    // error
    var html_text = alipaySubmit.buildRequestHttp(parameter, function(html_text){
        console.log('=============== after buildRequestHttp:');
        //URLDECODE返回的信息
        html_text = decodeURIComponent(html_text);
        
        if(html_text.indexOf('res_error')!= -1 || html_text.length == 0){
            console.log('error==========');
            console.log(html_text);
            return ;
        }
            
        //解析远程模拟提交后返回的信息    
        // var para_html_text =  alipaySubmit.parseResponse(html_text);
        // var request_token = para_html_text['request_token'];
        //i write
        var request_token = alipaySubmit.parseResponse(html_text);
        // console.log(request_token);
        /**************************根据授权码token调用交易接口alipay.wap.auth.authAndExecute**************************/

        //业务详细
        req_data = '<auth_and_execute_req><request_token>' + request_token + '</request_token></auth_and_execute_req>';
        //构造要请求的参数数组，无需改动

        parameter = {
                "service" : "alipay.wap.auth.authAndExecute"
                ,"partner" : self.alipay_config.partner
                ,"sec_id" : self.alipay_config.sign_type
                ,"format"   : format
                ,"v"    : v
                ,"req_id"   : req_id
                ,"req_data" : req_data
                ,"_input_charset"   : self.alipay_config.input_charset              
        };

        //建立请求
        alipaySubmit = new AlipaySubmit(self.alipay_config);
        html_text = alipaySubmit.buildRequestForm(parameter, 'get', '确认');
        console.log('=============== ready to pay ');
        console.log('=============== send back:');
        console.log(html_text);
        res.send(html_text);
    });
}


//支付宝即时到帐交易接口
/*data{
 out_trade_no:'' //商户订单号, 商户网站订单系统中唯一订单号，必填
 ,subject:'' //订单名称 必填
 ,total_fee:'' //付款金额,必填
 ,body:'' //订单描述
 ,show_url:'' //商品展示地址 需以http://开头的完整路径，例如：http://www.xxx.com/myorder.html
 }*/

Alipay.prototype.create_direct_pay_by_user = function(data, res){
    console.log(data.out_trade_no , data.subject , data.total_fee);
    assert.ok(data.out_trade_no && data.subject && data.total_fee);
    console.log('##################### start');
    //建立请求
    this.alipay_config.gateway = 'https://mapi.alipay.com/gateway.do?';
    var alipaySubmit = new AlipaySubmit(this.alipay_config);

    var parameter = {
        service:'create_direct_pay_by_user'
        ,partner:this.alipay_config.partner
        ,payment_type:'1' //支付类型
        ,notify_url: url.resolve(this.alipay_config.host, this.alipay_config.create_direct_pay_by_user_notify_url)//服务器异步通知页面路径,必填，不能修改, 需http://格式的完整路径，不能加?id=123这类自定义参数
        ,return_url: url.resolve(this.alipay_config.host , this.alipay_config.create_direct_pay_by_user_return_url)//页面跳转同步通知页面路径 需http://格式的完整路径，不能加?id=123这类自定义参数，不能写成http://localhost/
        ,seller_email:this.alipay_config.seller_email //卖家支付宝帐户 必填      
        ,_input_charset:this.alipay_config['input_charset'].toLowerCase().trim()
    };
    for(var key in data){
        parameter[key] = data[key];
    }
    delete parameter['_id'] 
    delete parameter['address'] 
    delete parameter['color'] 
    delete parameter['size'] 
    delete parameter['deliveryTime'] 
    delete parameter['mark'] 
    delete parameter['mobile'] 
    delete parameter['name'] 
    delete parameter['orderDay'] 
    delete parameter['payStatus'] 
    delete parameter['updatedAt'] 
    delete parameter['orderDay'] 
    //console.log("in Alipay.prototype.create_direct_pay_by_user ",parameter );
    // https://mapi.alipay.com/gateway.do?
    // _input_charset=utf-8&
    // notify_url=http%3A%2F%2F119.130.230.129%3A9999%2Fctm%2Falipay%2Fcreate_direct_pay_by_user%2Fnotify_url&
    // out_trade_no=20130731172935&
    // partner=2088902598394506&
    // payment_type=1&
    // return_url=http%3A%2F%2F119.130.230.129%3A9999%2Fctm%2Falipay%2Fcreate_direct_pay_by_user%2Freturn_url&
    // seller_email=payment10%40kalengo.com&
    // service=create_direct_pay_by_user&
    // size=%E5%9D%87%E7%A0%81&subject=chaobaidaCTM&
    // total_fee=0.01&
    // sign=030d8f057239bd21685470aeeb2656d6&
    // sign_type=MD5

    parameter.subject = 'chaobaidaCTM';
    parameter.body = 'chaobaidaCTM';    
    var html_text = alipaySubmit.buildRequestForm(parameter,"get", "确认");
    logger.info ('#######html_text##########');
    console.log(html_text);
    res.send(html_text);
}

//即时到账批量退款有密接口
/*  data{
    refund_date:'',//退款当天日期, 必填，格式：年[4位]-月[2位]-日[2位] 小时[2位 24小时制]:分[2位]:秒[2位]，如：2007-10-01 13:13:13
    batch_no: '', //批次号, 必填，格式：当天日期[8位]+序列号[3至24位]，如：201008010000001
    batch_num:'', //退款笔数, 必填，参数detail_data的值中，“#”字符出现的数量加1，最大支持1000笔（即“#”字符出现的数量999个）
    detail_data: '',//退款详细数据 必填，具体格式请参见接口技术文档
} */
Alipay.prototype.refund_fastpay_by_platform_pwd = function(data, res){
    assert.ok(data.refund_date && data.batch_no && data.batch_num && data.detail_data);
    //建立请求
    var alipaySubmit = new AlipaySubmit(this.alipay_config);
    
    //构造要请求的参数数组，无需改动
    var parameter = {
        service : 'refund_fastpay_by_platform_pwd',
        partner : this.alipay_config.partner,
        notify_url  : url.resolve(this.alipay_config.host, this.alipay_config.refund_fastpay_by_platform_pwd_notify_url),
        seller_email    : this.alipay_config.seller_email,
        
        refund_date : data.refund_date,
        batch_no    : data.batch_no,
        batch_num   : data.batch_num,
        detail_data : data.detail_data,
        
        _input_charset  : this.alipay_config['input_charset'].toLowerCase().trim()
    };

    var html_text = alipaySubmit.buildRequestForm(parameter,"get", "确认");
    res.send(html_text);
}

//支付宝纯担保交易接口接口

Alipay.prototype.create_partner_trade_by_buyer = function(data, res){
    //建立请求
    var alipaySubmit = new AlipaySubmit(this.alipay_config);
    
    //构造要请求的参数数组，无需改动
    var parameter = {
        service : 'create_partner_trade_by_buyer',
        partner : this.alipay_config.partner,
        payment_type: '1',
        notify_url  : url.resolve(this.alipay_config.host, this.alipay_config.create_partner_trade_by_buyer_notify_url),
        return_url : url.resolve(this.alipay_config.host , this.alipay_config.create_partner_trade_by_buyer_return_url),
        seller_email    : this.alipay_config.seller_email, 
        
        out_trade_no    : data.out_trade_no,
        subject : data.subject,
        price   : data.price,
        quantity    : data.quantity,
        logistics_fee   : data.logistics_fee,
        logistics_type  : data.logistics_type,
        logistics_payment   : data.logistics_payment,
        body    : data.body,
        show_url    : data.show_url,
        receive_name    : data.receive_name,
        receive_address : data.receive_address,
        receive_zip : data.receive_zip,
        receive_phone   : data.receive_phone,
        receive_mobile  : data.receive_mobile,
        
        _input_charset  : this.alipay_config['input_charset'].toLowerCase().trim()
    };

    var html_text = alipaySubmit.buildRequestForm(parameter,"get", "确认");
    res.send(html_text);
}

Alipay.prototype.send_goods_confirm_by_platform = function(data, res){
    //建立请求
    var alipaySubmit = new AlipaySubmit(this.alipay_config);
    
    //构造要请求的参数数组，无需改动
    var parameter = {
        service : 'send_goods_confirm_by_platform',
        partner : this.alipay_config.partner,
        
        trade_no : data.trade_no,
        logistics_name : data.logistics_name,
        invoice_no : data.invoice_no,
        transport_type : data.transport_type,
        
        _input_charset  : this.alipay_config['input_charset'].toLowerCase().trim()
    };

    alipaySubmit.buildRequestHttp(parameter, function(html_text){
        //解析XML html_text
        var doc = new DOMParser().parseFromString(html_text);
        var is_success = doc.getElementsByTagName('is_success').item(0).firstChild.nodeValue
        if(is_success == 'T'){
            var out_trade_no = doc.getElementsByTagName('out_trade_no').item(0).firstChild.nodeValue;
            var trade_no = doc.getElementsByTagName('trade_no').item(0).firstChild.nodeValue;
            self.emit('send_goods_confirm_by_platform_success', out_trade_no, trade_no, html_text);
        }
        else if(is_success == 'F'){
            var error = doc.getElementsByTagName('error').item(0).firstChild.nodeValue;
            self.emit('send_goods_confirm_by_platform_fail', error);
        }
    });     
}

Alipay.prototype.trade_create_by_buyer = function(data, res){
    //建立请求
    var alipaySubmit = new AlipaySubmit(this.alipay_config);
    
    //构造要请求的参数数组，无需改动
    var parameter = {
        service : 'trade_create_by_buyer',
        partner : this.alipay_config.partner,
        payment_type: '1',
        notify_url  : url.resolve(this.alipay_config.host, this.alipay_config.trade_create_by_buyer_notify_url),
        return_url : url.resolve(this.alipay_config.host , this.alipay_config.trade_create_by_buyer_return_url),
        seller_email    : this.alipay_config.seller_email, 
        
        out_trade_no    : data.out_trade_no,
        subject : data.subject,
        price   : data.price,
        quantity    : data.quantity,
        logistics_fee   : data.logistics_fee,
        logistics_type  : data.logistics_type,
        logistics_payment   : data.logistics_payment,
        body    : data.body,
        show_url    : data.show_url,
        receive_name    : data.receive_name,
        receive_address : data.receive_address,
        receive_zip : data.receive_zip,
        receive_phone   : data.receive_phone,
        receive_mobile  : data.receive_mobile,
        
        _input_charset  : this.alipay_config['input_charset'].toLowerCase().trim()
    };

    var html_text = alipaySubmit.buildRequestForm(parameter,"get", "确认");
    res.send(html_text);
}

Alipay.prototype.trade_create_by_buyer_return = function(req, res){
    var self = this;

    var _GET = req.query;
    //计算得出通知验证结果
    var alipayNotify = new AlipayNotify(this.alipay_config);
    //验证消息是否是支付宝发出的合法消息
    var verify_result = alipayNotify.verifyReturn(_GET);

    if(verify_result) {//验证成功
        //商户订单号
        var out_trade_no = _GET['out_trade_no'];
        //支付宝交易号
        var trade_no = _GET['trade_no'];
        //交易状态
        var trade_status = _GET['trade_status'];
        
        if(trade_status  == 'WAIT_BUYER_PAY'){                
            self.emit('trade_create_by_buyer_wait_buyer_pay', out_trade_no, trade_no);
        }
        else if(trade_status == 'WAIT_SELLER_SEND_GOODS'){                
            self.emit('trade_create_by_buyer_wait_seller_send_goods', out_trade_no, trade_no);
        }
        else if(trade_status == 'WAIT_BUYER_CONFIRM_GOODS'){                
            self.emit('trade_create_by_buyer_wait_buyer_confirm_goods', out_trade_no, trade_no);
        }
        else if(trade_status == 'TRADE_FINISHED'){                
            self.emit('trade_create_by_buyer_trade_finished', out_trade_no, trade_no);
        }
        
        res.send("success");
    }
    else{
        //验证失败
        self.emit("verify_fail");
        res.send("fail");
    }
}

Alipay.prototype.trade_create_by_buyer_notify = function(req, res){
    var self = this;

    var _POST = req.body;
    //计算得出通知验证结果
    var alipayNotify = new AlipayNotify(this.alipay_config);
    //验证消息是否是支付宝发出的合法消息
    var verify_result = alipayNotify.verifyNotify(_POST);

    if(verify_result) {//验证成功
        //商户订单号
        var out_trade_no = _POST['out_trade_no'];
        //支付宝交易号
        var trade_no = _POST['trade_no'];
        //交易状态
        var trade_status = _POST['trade_status'];
        
        if(trade_status  == 'WAIT_BUYER_PAY'){                
            self.emit('trade_create_by_buyer_wait_buyer_pay', out_trade_no, trade_no);
        }
        else if(trade_status == 'WAIT_SELLER_SEND_GOODS'){                
            self.emit('trade_create_by_buyer_wait_seller_send_goods', out_trade_no, trade_no);
        }
        else if(trade_status == 'WAIT_BUYER_CONFIRM_GOODS'){                
            self.emit('trade_create_by_buyer_wait_buyer_confirm_goods', out_trade_no, trade_no);
        }
        else if(trade_status == 'TRADE_FINISHED'){                
            self.emit('trade_create_by_buyer_trade_finished', out_trade_no, trade_no);
        }
        
        res.send("success");
    }
    else{
        //验证失败
        self.emit("verify_fail");
        res.send("fail");
    }
}

Alipay.prototype.refund_fastpay_by_platform_pwd_notify = function(req, res){
     var self = this;

    var _POST = req.body;
    //计算得出通知验证结果
    var alipayNotify = new AlipayNotify(this.alipay_config);
    //验证消息是否是支付宝发出的合法消息
    var verify_result = alipayNotify.verifyNotify(_POST);

    if(verify_result) {//验证成功
        //批次号
        var batch_no = _POST['batch_no'];
        //批量退款数据中转账成功的笔数
        var success_num = _POST['success_num'];
        //批量退款数据中的详细信息
        var result_details = _POST['result_details'];
        
        self.emit('refund_fastpay_by_platform_pwd_success', batch_no, success_num, result_details);
        
        res.send("success");        //请不要修改或删除
    }
    else{
         //验证失败
        self.emit("verify_fail");
        res.send("fail");
    }
}

Alipay.prototype.create_partner_trade_by_buyer_return = function(req, res){
    var self = this;

    var _GET = req.query;
    //计算得出通知验证结果
    var alipayNotify = new AlipayNotify(this.alipay_config);
    //验证消息是否是支付宝发出的合法消息
    var verify_result = alipayNotify.verifyReturn(_GET);

    if(verify_result) {//验证成功
        //商户订单号
        var out_trade_no = _GET['out_trade_no'];
        //支付宝交易号
        var trade_no = _GET['trade_no'];
        //交易状态
        var trade_status = _GET['trade_status'];
        
        if(trade_status  == 'WAIT_BUYER_PAY'){                
            self.emit('create_partner_trade_by_buyer_wait_buyer_pay', out_trade_no, trade_no);
        }
        else if(trade_status == 'WAIT_SELLER_SEND_GOODS'){                
            self.emit('create_partner_trade_by_buyer_wait_seller_send_goods', out_trade_no, trade_no);
        }
        else if(trade_status == 'WAIT_BUYER_CONFIRM_GOODS'){                
            self.emit('create_partner_trade_by_buyer_wait_buyer_confirm_goods', out_trade_no, trade_no);
        }
        else if(trade_status == 'TRADE_FINISHED'){                
            self.emit('create_partner_trade_by_buyer_trade_finished', out_trade_no, trade_no);
        }
        
        res.send("success");
    }
    else{
        //验证失败
        self.emit("verify_fail");
        res.send("fail");
    }
}

Alipay.prototype.create_partner_trade_by_buyer_notify = function(req, res){
    var self = this;

    var _POST = req.body;
    //计算得出通知验证结果
    var alipayNotify = new AlipayNotify(this.alipay_config);
    //验证消息是否是支付宝发出的合法消息
    var verify_result = alipayNotify.verifyNotify(_POST);

    if(verify_result) {//验证成功
        //商户订单号
        var out_trade_no = _POST['out_trade_no'];
        //支付宝交易号
        var trade_no = _POST['trade_no'];
        //交易状态
        var trade_status = _POST['trade_status'];
        
        if(trade_status  == 'WAIT_BUYER_PAY'){                
            self.emit('create_partner_trade_by_buyer_wait_buyer_pay', out_trade_no, trade_no);
        }
        else if(trade_status == 'WAIT_SELLER_SEND_GOODS'){                
            self.emit('create_partner_trade_by_buyer_wait_seller_send_goods', out_trade_no, trade_no);
        }
        else if(trade_status == 'WAIT_BUYER_CONFIRM_GOODS'){                
            self.emit('create_partner_trade_by_buyer_wait_buyer_confirm_goods', out_trade_no, trade_no);
        }
        else if(trade_status == 'TRADE_FINISHED'){                
            self.emit('create_partner_trade_by_buyer_trade_finished', out_trade_no, trade_no);
        }
        
        res.send("success");
    }
    else{
        //验证失败
        self.emit("verify_fail");
        res.send("fail");
    }
}
Alipay.prototype.verify_my = function(config, data){
    return true;
}


Alipay.prototype.create_direct_pay_by_user_notify = function(req, res, callback){     
    
    var self = this;
    var _POST = req.body;
    console.log('===========================----------- post data: ');
    logger.info(_POST);
    //计算得出通知验证结果
    var alipayNotify = new AlipayNotify(this.alipay_config);
    //验证消息是否是支付宝发出的合法消息
    alipayNotify.verifyNotify(_POST, function(err,data){
        if(err){
            //验证失败
            self.emit("verify_fail");
            logger.error("notify verify_fail ", out_trade_no, trade_no);
            callback ('verify_fail');
        }else{
            res.send("success");        //请不要修改或删除
            callback(null, data);
        }
        // console.log ("verify_result:", verify_result);        
        // console.log('verifyNotifyData:-------------------------');
        // console.log(_POST);
        // if(verify_result){
        //     if(typeof(_POST) === "object"){
        //         var out_trade_no = _POST['out_trade_no'];
        //         //支付宝交易号
        //         var trade_no = _POST['trade_no'];
        //         //交易状态
        //         // var trade_status = _POST['trade_status'];
        //         var trade_status = _POST['trade_status'];
        //         console.log(trade_status);
        //         if(trade_status  == 'TRADE_FINISHED'){                
        //             //self.emit('create_direct_pay_by_user_trade_finished', out_trade_no, trade_no);
        //         }
        //         else if(trade_status == 'TRADE_SUCCESS'){                
        //             //self.emit('create_direct_pay_by_user_trade_success', out_trade_no, trade_no);
        //         }
        //         self.emit('create_direct_pay_by_user_trade_success', out_trade_no, trade_no); 
        //         logger.info("out_trade_no ", out_trade_no, " trade_no ", trade_no, "paid" );
        //         res.send("success");        //请不要修改或删除
        //         callback(null, {"out_trade_no":out_trade_no, "trade_no":trade_no, "result":"TRADE_SUCCESS"});
        //     }else{
        //         parser = new xml2js.Parser();
        //         parser.parseString(_POST,function(err, notify_data_js) {
        //             if(err){
        //                 console.log( '回复解析过程出错，错误信息为：'+ err);
        //             }
        //             else{
                        
        //                 //商户订单号
        //                 var out_trade_no = notify_data_js.notify['out_trade_no'][0];
        //                 //支付宝交易号
        //                 var trade_no = notify_data_js.notify['trade_no'][0];
        //                 // console.log(out_trade_no );
        //                 // console.log(trade_no );            
        //                 //交易状态
        //                 // var trade_status = _POST['trade_status'];
        //                 var trade_status = notify_data_js.notify['trade_status'][0];
        //                 console.log(trade_status);
        //                 if(trade_status  == 'TRADE_FINISHED'){                
        //                     //self.emit('create_direct_pay_by_user_trade_finished', out_trade_no, trade_no);
        //                 }
        //                 else if(trade_status == 'TRADE_SUCCESS'){                
        //                     //self.emit('create_direct_pay_by_user_trade_success', out_trade_no, trade_no);
        //                 }
        //                 self.emit('create_direct_pay_by_user_trade_success', out_trade_no, trade_no); 
        //                 logger.info("out_trade_no ", out_trade_no, " trade_no ", trade_no, "paid" );
        //                 res.send("success");        //请不要修改或删除
        //                 callback(null, {"out_trade_no":out_trade_no, "trade_no":trade_no, "result":"TRADE_SUCCESS"});
        //             }
        //         });
        //     }
        // }else{
        //     //验证失败
        //     self.emit("verify_fail");
        //     logger.error("notify verify_fail ", out_trade_no, trade_no);
        //     callback ('verify_fail');
        // }
    });
}

// Alipay.prototype.create_direct_pay_by_user_notify = function(req, res){

//     var self = this;

//     var _POST = req.body;
//     //计算得出通知验证结果
//     var alipayNotify = new AlipayNotify(this.alipay_config);
//     //验证消息是否是支付宝发出的合法消息
//     var verify_result = alipayNotify.verifyNotify(_POST);
//     console.log('===========================----------- post data: ');
//     logger.info(_POST);
    
//     //商户订单号
//     var out_trade_no = _POST['out_trade_no'];
//     //支付宝交易号
//     var trade_no = _POST['trade_no'];
//     console.log("----------1111 no:");
//     console.log (out_trade_no);
//     console.log (trade_no);
//     if(verify_result) {//验证成功
        
//         //交易状态
//         var trade_status = _POST['trade_status'];
//         console.log(trade_status);
//         if(trade_status  == 'TRADE_FINISHED'){                
//             //self.emit('create_direct_pay_by_user_trade_finished', out_trade_no, trade_no);
//         }
//         else if(trade_status == 'TRADE_SUCCESS'){                
//             //self.emit('create_direct_pay_by_user_trade_success', out_trade_no, trade_no);
//         }
//         self.emit('create_direct_pay_by_user_trade_success', out_trade_no, trade_no); 
//         logger.info("out_trade_no ", out_trade_no, " trade_no ", trade_no, "paid" );
//         res.send("success");        //请不要修改或删除
//     }
//     else {
//         //验证失败
//         self.emit("verify_fail");
//         logger.error("notify verify_fail ", out_trade_no, trade_no);
//         // res.send("fail");
//     }
// }

Alipay.prototype.create_direct_pay_by_user_return = function(req, res, callback){     
    var self = this;
    
    var _GET = req.query;
    //计算得出通知验证结果
    //商户订单号
    var alipayNotify = new AlipayNotify(this.alipay_config);
    var out_trade_no = _GET['out_trade_no'];
    //支付宝交易号
    var trade_no = _GET['trade_no'];
    //var verify_result = alipayNotify.verifyReturn(_GET);
    console.log('===========================');
    console.log(_GET);    
    alipayNotify.verifyReturn(_GET,function(isVerify){
        if(isVerify){
            //交易状态
            var trade_status = _GET['trade_status'];
            console.log(trade_status);

            if(trade_status  == 'TRADE_FINISHED'){                
                self.emit('create_direct_pay_by_user_trade_finished', out_trade_no, trade_no);
            }
            else if(trade_status == 'TRADE_SUCCESS'){                
                self.emit('create_direct_pay_by_user_trade_success', out_trade_no, trade_no);
            }
            callback(null, {"out_trade_no":out_trade_no, "trade_no":trade_no, "result":"TRADE_SUCCESS"});
        }else{
            //验证失败
            self.emit("verify_fail");
            logger.error("return verify_fail ", out_trade_no, trade_no);
            //res.send("fail");
            // res.redirect('/static/ctm/index.html?success=false&id=' + req.session.iid);
            //how to redirect to /static/ctm/index.html?success=false
            callback ('verify_fail');
            }
    });
    
    // if(verify_result) {//验证成功
        
    //     //交易状态
    //     var trade_status = _GET['trade_status'];
    //     console.log(trade_status);

    //     if(trade_status  == 'TRADE_FINISHED'){                
    //         self.emit('create_direct_pay_by_user_trade_finished', out_trade_no, trade_no);
    //     }
    //     else if(trade_status == 'TRADE_SUCCESS'){                
    //         self.emit('create_direct_pay_by_user_trade_success', out_trade_no, trade_no);
    //     }
    //     callback(null, {"out_trade_no":out_trade_no, "trade_no":trade_no, "result":"TRADE_SUCCESS"});
    //     //res.send("success");      //请不要修改或删除
    //     // res.redirect('/static/ctm/index.html?success=true&id=' + req.session.iid);//  
    //     //how to redirect to /static/ctm/index.html?success=true
    // }
    // else {
    //     //验证失败
    //     self.emit("verify_fail");
    //     logger.error("return verify_fail ", out_trade_no, trade_no);
    //     //res.send("fail");
    //     // res.redirect('/static/ctm/index.html?success=false&id=' + req.session.iid);
    //     //how to redirect to /static/ctm/index.html?success=false
    //     callback ('verify_fail');
    // }
}
    
exports.Alipay = Alipay;
    
// ali = new Alipay();

// postdata = { service: 'alipay.wap.trade.create.direct',
//   sign: '991651a9b8eaad37dc857f5ce677bfcf',
//   sec_id: 'MD5',
//   v: '1.0',
//   notify_data: '<notify><payment_type>1</payment_type><subject>chaobaidaCTM</subject><trade_no>2013071219201715</trade_no><buyer_email>329422126@qq.com</buyer_email><gmt_create>2013-07-12 13:34:09</gmt_create><notify_type>trade_status_sync</notify_type><quantity>1</quantity><out_trade_no>20130712133341</out_trade_no><notify_time>2013-07-12 14:58:23</notify_time><seller_id>2088902598394506</seller_id><trade_status>TRADE_SUCCESS</trade_status><is_total_fee_adjust>N</is_total_fee_adjust><total_fee>46.00</total_fee><gmt_payment>2013-07-12 13:34:53</gmt_payment><seller_email>payment10@kalengo.com</seller_email><price>46.00</price><buyer_id>2088602119300158</buyer_id><notify_id>3d036301568da43cd46574fb47635bf72u</notify_id><use_coupon>N</use_coupon></notify>' };

// req = {};
// req.body = {};
// req.body = postdata;
// res= {};
// ali.create_direct_pay_by_user_notify(req, res) ;
