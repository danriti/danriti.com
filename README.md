# danriti.com

My homepage.

## Deployment

```bash
$ aws login
$ aws s3 sync ./public s3://danriti.com/ --dryrun
$ aws s3 sync ./public s3://danriti.com/
```
