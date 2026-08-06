# danriti.com

My homepage.

## Deployment

```bash
$ aws login
$ cd zola
$ zola build
$ aws s3 sync ./public s3://danriti.com/ --dryrun
$ aws s3 sync ./public s3://danriti.com/
$ aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
```
