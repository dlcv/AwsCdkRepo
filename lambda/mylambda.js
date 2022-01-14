const AWS = require('aws-sdk')
const s3 = new AWS.S3()

exports.handler = async function(event) {
    buckets = await s3.listBuckets().promise()
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/json"
        },
        body: JSON.stringify({
            buckets
        })
    };
}