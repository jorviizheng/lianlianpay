
var default_alipay_config = {
    oid_partner:'201307032000003506' //商户编号是商户在连连钱包支付平台上开设的商户号码，为18位数字，如：201304121000001004
    ,key:'201307032000003506'//安全检验码，以数字和字母组成的字符
    ,version:'1.1' //版本号
    ,app_request:'3' //请求应用标识 为wap版本，不需修改
    ,sign_type:'MD5'//签名方式 不需修改
     //订单有效时间  分钟为单位，默认为10080分钟（7天） 
    ,valid_order: '0'

    //字符编码格式 目前支持 gbk 或 utf-8
    ,input_charset :'utf-8'

    //访问模式,根据自己的服务器是否支持ssl访问，若支持请选择https；若不支持请选择http
    ,transport : 'http'
};
exports.Config = default_alipay_config;