# lambda-zb

Exploratory integration point

## Deployment process

* Check this code out
* Create your env.yml and define BMS_API_USERNAME, BMS_API_PASSWORD and BMS_API_TENANT
* Install serverless (from serverless.com)
* Ensure you have your AWS credentials configured
* Deploy (serverless deploy -v)
* Point webhook at API response from serverless


## Expected fields in POST call

* firstname
* lastname
* companyname
* phone
* email

All other fields will be ignored.


## TODO

* Turn this into a 1-click deploy into AWS