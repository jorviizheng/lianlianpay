##lianlianpay
`   API: getPrepositPayHtml(obj) //sholud be return formhtml
`   wap支付
        var express = require('express');
        var app = express();
        var llpay = require('lianlianpay');
        var webllpay = llpay.wapllpay;
        var intiData = {
            oid_partner:"",//商户ID,连连后台查看
            key:"",//MD5加密key，连连后台查看
            notify_url:'http://****/webllpay/notify_url',//异步返回地址
            url_return:'http://****/webllpay/url_return'//同步返回地址
        }
        var initWebllpay = new webllpay(intiData);//实例化
        app.get('/webllpay',function(req,res){
            var testData = {
                user_id:'',//该用户在商户系统中的唯一编号,要求是该编号在商户系统中唯一标识该用户
                no_order:'',//商户系统唯一订单号
                dt_order:'',//商户订单时间,格式:YYYYMMDDH24MISS,14 位数字,精确到秒
                money_order:'0.01',//交易金额,该笔订单的资金总额,单位为 RMB-元。号交易金额大于 0 的数字,精确到小数点后两位。如:49.65
                id_no:'',//证件号码,身份证,18位
                acct_name:'',//银行账号姓名
                card_no:"",
                risk_item:"",//用户注册时间,YYYYMMDDH24MISS,14 位数字,精确到秒
            }
            //连连支付api,参数正确会返回表单html
            var html = initWebllpay.getPrepositPayHtml(testData);
            console.log('html:'+html);
            res.send(html);
        });
        //连连同步回掉以post方式发送字节流
        app.post('/webllpay/url_return',function(req,res){
            var body = '';
            //注意：以字节流方式接收数据
            req.on('data',function(chunk){
                //console.log(Buffer.isBuffer(chunk))
                body += chunk
            });
            req.on('end',function(){
                console.log(body);
                var result = webllpay.UTIL.resStringToJSON(body);
                //签名认证
                if(initWebllpay.verify(result)){                    
                    // result:{
                    //  dt_order: "20150428094535",
                    //  money_order: "0.01",
                    //  no_order: "5518d825d5cdc86106eebbb",
                    //  oid_partner: "201504271000300502",
                    //  oid_paybill: "2015042856374872",
                    //  result_pay: "SUCCESS",
                    //  settle_date: "20150428",
                    //  sign: "530f7055278abaabcc940f14e4e553cb",
                    //  sign_type: "MD5"
                    // }
                    //支付结果认证
                    if(initWebllpay.success(result)){
                        //支付结果以此为准,商户按此进行后续是否发货操作
                        res.json(result);
                    }else{
                        res.send('支付不成功');//支付不成功
                    }       
                }else{
                    //数据认证不通过,数据被篡改
                    res.json(result);
                }   
            })
        });
        //连连异步回掉以post方式发送字节流
        app.post('/webllpay/notify_url',function(req,res){
            //注意：以字节流方式接收数据
            var body = '';
            req.on('data',function(chunk){
                //console.log(Buffer.isBuffer(chunk))
                body += chunk
            });
            req.on('end',function(){
                console.log(body);
                var result = webllpay.UTIL.resStringToJSON(body);
                //签名认证
                if(initWebllpay.verify(result)){
                    //支付结果认证
                    if(initWebllpay.success(result)){
                        //支付结果以此为准,商户按此进行后续是否发货操作
                        console.log('+++++++++++++++++++++++++');
                        console.log(result);
                        // result:{ 
                        //  bank_code: '01030000',
                        //  dt_order: '20150428163735',
                        //  info_order: '考拉理财,开启懒人理财生活。',
                        //  money_order: '0.01',
                        //  no_order: '5518d825d5cdc86106eeddd',
                        //  oid_partner: '201504271000300502',
                        //  oid_paybill: '2015042856458221',
                        //  pay_type: 'D',
                        //  result_pay: 'SUCCESS',
                        //  settle_date: '20150428',
                        //  sign: '6f1b420eaa774071f0e07a4221658466',
                        //  sign_type: 'MD5' 
                        // }
                        console.log('+++++++++++++++++++++++++');
                        //注意，这里必须返回固定的json数据给连连
                        res.json({"ret_code":"0000","ret_msg":"交易成功"});//连连要求返回的数据，以表示商户正常接受到异步订单处理
                    }else{
                        res.send('支付不成功');//支付不成功
                    }               
                }else{
                    //数据认证不通过,数据被篡改
                    res.json(result);
                }   
            })
        });
        //连连支付失败后的同步返回地址，get请求
        app.get('/webllpay/url_return',function(req,res){
            res.send('支付失败了');
        });
        app.listen(8007);
        console.log('app listen on 8007');  