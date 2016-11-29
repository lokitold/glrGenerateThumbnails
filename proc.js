/**
 * Created by victor on 29/11/16.
 * https://www.npmjs.com/package/aws-lambda-invoke
 */
var aws = require('aws-sdk');
aws.config.update({region:'us-east-1'});

// prueba en tu pc -.-
//aws.config.update({region:'us-east-1',secretAccessKey:'dddddddddd',accessKeyId:'rrrrrrrrrrrrrrrreeeeeeeeeeeeeeeeeeeee'});

const lambda = require('aws-lambda-invoke');

var event = {
  "Records": [
    {
      "eventVersion": "2.0",
      "eventSource": "aws:s3",
      "awsRegion": "us-east-1",
      "eventTime": "2016-11-28T04:03:39.359Z",
      "eventName": "ObjectCreated:Put",
      "userIdentity": {
        "principalId": "AWS:AIDAJ5KU2XIUKIDGRVMKY"
      },
      "requestParameters": {
        "sourceIPAddress": "179.7.214.174"
      },
      "responseElements": {
        "x-amz-request-id": "DDAF87FED7B7F2F0",
        "x-amz-id-2": "sTc+loSeL5BqSGrFKTZpksWCoYm4upldDuR2mCEh+iS4EYe/UeQf0QFimeMiaPcU"
      },
      "s3": {
        "s3SchemaVersion": "1.0",
        "configurationId": "3d4e2e55-b1d5-41cb-a369-548aed5935df",
        "bucket": {
          "name": "libero-media-v",
          "ownerIdentity": {
            "principalId": "A2NV1NQXJVK9VY"
          },
          "arn": "arn:aws:s3:::libero-media-v"
        },
        "object": {
          "key": "libero/imagen/2016/01/22/23081870.jpg",
          "size": 84034,
          "eTag": "99a81f8bf2b4b28adebb82e849d319d2",
          "sequencer": "00583BAC9B43BCC3D3"
        }
      }
    }
  ]
};

lambda.invokeAsync('glrGenerateThumbnails-dev-resize', event).then(result => {
    console.log(result);
//=> '{"foo": "baz"}'
});
