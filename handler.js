'use strict';

var aws = require('aws-sdk');
var s3 = new aws.S3({ apiVersion: '2006-03-01' });
var gm = require('gm').subClass({ imageMagick: true });
var fs = require('fs');
var countSend = 0;
var countProc = 0;
var TOPIC_ARN = "arn:aws:sns:us-east-1:543745842878:CMS_THUMB_SNS";

module.exports.resize = (event, context, callback) => {


  console.log(JSON.stringify(event));
  var srcBucket = event.Records[0].s3.bucket.name;
  var srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  countSend = 0;
  countProc = 0;
  var dstBucket = "libero-media";

  if (srcBucket == dstBucket) {
      console.error("El bucket destino debe ser diferente al bucket.");
      context.succeed("Salir");
      return;
  }

  // Detectar el tipo de imagen
  var typeMatch = srcKey.match(/\.([^.]*)$/);
  if (!typeMatch) {
      console.error('El tipo no coincide con una imagen válida para el key: ' + srcKey);
      context.succeed("No se procesa");
      return;
  }
  var imageType = typeMatch[1].toLowerCase();
  if (imageType == "jpg" || imageType == "jpeg" || imageType == "png") {
      return uploadStaticImage(srcBucket, dstBucket, srcKey, imageType, context);
  } else {
      console.log("Formato no soportado.");
      context.succeed("No se ejecuta nada");
      return false;
  }

};


module.exports.resizeApi = (event, context, callback) => {
  console.log(JSON.stringify(event));
  console.log(JSON.stringify(context));
  // validate parmas image
  var uriImage = event.queryStringParameters.image;
  uriImage = decodeURI(uriImage); 
  if (!uriImage.trim()) {
    callback(new Error('params image required'));
  }
  //console.log(JSON.stringify(uriImage));

  var srcBucket = "libero-media-v";
  var srcKey    = decodeURIComponent(uriImage.replace(/\+/g, " "));
  countSend = 0;
  countProc = 0;
  var dstBucket = "libero-media";

  if (srcBucket == dstBucket) {
      console.error("El bucket destino debe ser diferente al bucket.");
      context.succeed("Salir");
      return;
  }

  // Detectar el tipo de imagen
  var typeMatch = srcKey.match(/\.([^.]*)$/);
  
  if (!typeMatch) {
      console.error('El tipo no coincide con una imagen válida para el key: ' + srcKey);
      context.succeed("No se procesa");
      return callback(new Error('El tipo no coincide con una imagen válida para el key: ' + srcKey)); 
  }

  var imageType = typeMatch[1].toLowerCase();
  //console.log(JSON.stringify(imageType));
  
  if (imageType == "jpg" || imageType == "jpeg" || imageType == "png") {
      uploadStaticImage(srcBucket, dstBucket, srcKey, imageType, context);
  } else {
      console.log("Formato no soportado.");
      context.succeed("No se ejecuta nada");
      return callback(new Error("Formato no soportado.")); 
      //return false;
  }

  const response = {
        statusCode: 200,
        body: JSON.stringify({
        message: 'Imagen cargada',
        input: event,
        context : context
        }),
    };
  
    return callback(null, response);

  
  

};

function uploadStaticImage(srcBucket, dstBucket, srcKey, imageType, context)
{
    var params = {
        Bucket: srcBucket,
        Key: srcKey
    };
    var thumb_sizes = [
        {key:"medium", width: 439, height: 247},
        {key:"small",  width: 224, height: 126},
        {key:"normal", width: 604, height: 340},
        {key:"large",  width: 825, height: 464},
        {key:"xlarge", width: 1200,height: 675},
        {key:"thumb",  width: 88,  height: 50},
        {key:"xsmall", width: 71,  height: 40}
    ];
    s3.getObject(params, function(err, response) {
        if (err) {
            console.log(err);
        } else {
            var kb = response.ContentLength / 1024;
            if (kb > 800) {
                var item = {"srcBucket":srcBucket, "dstBucket":dstBucket, "srcKey":srcKey, "imageType":imageType};
                sendSNS(TOPIC_ARN, item,
                 function(data) {
                  context.succeed("Proceso SNS Lambda: CMS_THUMB_SNS"); 
                  
                });
            } else {
                for (var k in thumb_sizes) {
                    var dstKey = thumb_sizes[k].key + '/' + srcKey;
                    (function(dstKey) {
                        var ima = gm(response.Body);
                        if (imageType == "png") {
                            ima.flatten().setFormat("jpg");
                        }
                        countSend++;
                        ima.resize(null, thumb_sizes[k].height)
                            .gravity('Center')
                            .quality(98)
                            .borderColor("rgb(0,0,0)")
                            .border(300, 0)
                            .crop(thumb_sizes[k].width, thumb_sizes[k].height)
                            .toBuffer(function(err, buffer) {
                                if (err) {
                                    console.log(err);
                                    console.log("No write -> " + fn);
                                } else {
                                    callbackUploadS3(buffer, dstBucket, dstKey, response.ContentType, context);
                                }
                            });
                    })(dstKey);
                }
            }     
        }
    });

     return true;
}

function callbackUploadS3(buffer, bucket, dstKey, contentType, context) {
    s3.putObject({ Bucket: bucket, Key: dstKey, Body: buffer, ContentType: contentType },
     function(err, data) {
        countProc++;
        if (err) {
            console.log(err);
        } else {
            console.log("Se cargo " +bucket+'/'+ dstKey + " " + contentType);
        }
        if (countProc == countSend) {
            if (countProc == 7) {
                context.succeed("Proceso completado");
            } else {
                console.log("Se ejecutó "+countProc+" de 7 imágenes");
                context.succeed("Se lanzará otra vez");
            }
        }
    });
}

function sendSNS(TopicArn, Message , callback) {
    
    var sns = new aws.SNS();
    sns.publish({
        Message: JSON.stringify(Message),
        TopicArn: TopicArn
    }, function(err, data) {
        if (err) {
            console.log(err.stack);
            return;
        }
        callback(data);
    });
}
