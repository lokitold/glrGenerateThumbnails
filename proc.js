/**
 * Created by victor on 29/11/16.
 * https://www.npmjs.com/package/aws-lambda-invoke
 * http://stackoverflow.com/questions/9437581/node-js-amazon-s3-how-to-iterate-through-all-files-in-a-bucket
 * resize bucket libero-media-v
 * ejecutar :  node proc.js 
 */
var aws = require('aws-sdk');
aws.config.update({region:'us-east-1'});
// prueba en tu pc -.-
//aws.config.update({region:'us-east-1',secretAccessKey:'dddddddddd',accessKeyId:'rrrrrrrrrrrrrrrreeeeeeeeeeeeeeeeeeeee'});
const lambda = require('aws-lambda-invoke');
var s3 = new aws.S3();

var event = require('./event.json');
var srcBucket = event.Records[0].s3.bucket.name;


var params = {
    Bucket: srcBucket,
    Prefix: 'libero/imagen/2016/01/01/',
    EncodingType: 'url',
    //Delimiter : 'imagen/2010/05/05'
   // Sufix: '.jpg'
};

var s3DataContents = [];    // Single array of all combined S3 data.Contents

s3ListObjects(params);

function s3ListObjects(params) {
    s3.listObjects(params, function(err, data) {
        if (err) {
            console.log("listS3Objects Error:", err);
        } else {
            var contents = data.Contents;
            cant = 0;
			contents.forEach(function(entry) {
				var key = entry.Key;
				validationIsImage = (/\.(jpg|png)$/i).test(key)
				if(validationIsImage == true){
					console.log(key);
					event.Records[0].s3.object.key = key;
					lambda.invokeAsync('glrGenerateThumbnails-dev-resize', event).then(result => {
					    console.log(result);
					});
				}

			    cant = cant +1 ;
			});
			console.log("Cantidad de procesados (limit 1000): "+cant);
        }
    });
}




/*
lambda.invokeAsync('glrGenerateThumbnails-dev-resize', event).then(result => {
    console.log(result);
//=> '{"foo": "baz"}'
});

*/