const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async function(event) {
    // Created
    let created = false;

    // Search buckets in S3
    console.log('Listing buckets...');
    buckets = await s3.listBuckets().promise();

    // Check dynamically the correct bucket
    buckets.Buckets.forEach(async element => {
        console.log('Searching specific bucket...');
        // Bucket created with AWS CDK: search it by his name
        if (element.Name.includes('fdelacruzhackmetrixstack')) {
            // Create 2 files
            for (let index = 0; index < 2; index++) {
                // Define object
                console.log('Defining object...');
                const objectName = "file" + index + " .json";
                const objectData = '{ "status" : "true" }';
                const objectType = "application/json";

                try {
                    // Object params
                    const params = {
                        Bucket: element.Name,
                        Key: objectName,
                        Body: objectData,
                        ContentType: objectType
                    };

                    // Put object in S3
                    console.log('Putting object in S3...');
                    const result = await s3.putObject(params, function(err, data) {
                        if (err) {
                            console.log(err);
                            console.log('Creation of object failed in S3...');
                        } else {
                            console.log(data);
                            console.log('Object uploaded in S3...');
                        }
                    }).promise();

                    // Response
                    created = true;
                    console.log('Object created');
                } catch (error) {
                    console.log('Object NOT created');
                    return {
                        statusCode: 400,
                        headers: {
                            "Content-Type": "text/json"
                        },
                        body: JSON.stringify({
                            message: error
                        })
                    };
                }

            }
        }
    });

    if (created) {
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "text/json"
            },
            body: JSON.stringify({
                message: `Files created successfully in the bucket`
            })
        };
    } else {
        return {
            statusCode: 400,
            headers: {
                "Content-Type": "text/json"
            },
            body: JSON.stringify({
                message: `Files can't be created successfully in the bucket`
            })
        };
    }
}