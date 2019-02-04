'use strict';

const rp = require('request-promise');

const BMS_API_USERNAME = process.env.BMS_API_USERNAME;
const BMS_API_PASSWORD = process.env.BMS_API_PASSWORD;
const BMS_API_SERVER = process.env.BMS_API_SERVER ? process.env.BMS_API_SERVER : 'https://bms.kaseya.com'
const BMS_API_TENANT = process.env.BMS_API_TENANT;

global.access_token = '';

function web_call(method, url, payload) {
  return new Promise(function (resolve, reject) {
    const opt = {
      method: method,
      uri: BMS_API_SERVER + url,
      form: payload,
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + access_token
      },
      json: true
    }

    rp(opt).then(function (res) {
      resolve(res);
    }).catch(function (err) {
      console.log('web_call(): FAIL: ', err);
      reject(err);
    })
  });
}

function web_call2(method, url, payload) {
  return new Promise(function (resolve, reject) {
    const opt = {
      method: method,
      uri: BMS_API_SERVER + url,
      body: payload,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      },
      json: true
    }

    rp(opt).then(function (res) {
      resolve(res);
    }).catch(function (err) {
      console.log('web_call(): FAIL: ', err);
      reject(err);
    })
  });
}

function login() {
  return new Promise(function (resolve, reject) {
    const login_Promise = web_call(
      "POST",
      "/api/token",
      {
        username: BMS_API_USERNAME,
        password: BMS_API_PASSWORD,
        grant_type: "password",
        tenant: BMS_API_TENANT
      }
    );

    login_Promise.then(function (res) {
      access_token = res.access_token;
      console.log('login(): access token received -> ', access_token);
      resolve(access_token);
    }).catch(function (err) {
      console.log('login(): FAIL: ', err);
      reject(false);
    })
  });
}

function create_company(details) {
  return new Promise(function (resolve, reject) {
    var payload = [
      {
        "AccountType": "Prospect", // an available default account type 
        "AccountName": details.companyname,
        "BusinessType": "General", // default business type
        "AcquiredDate": "2005-12-07T00:00:00", // mandatory, even if docs says otherwise,
        "Description": "From webhook\n" + JSON.stringify(details),
      }
    ];

    console.log('create_company(): sending over payload');
    console.log(JSON.stringify(payload));

    var newCompany = web_call2(
      "POST",
      "/api/import/accounts",
      payload
    );

    newCompany.then(function (res) {
      console.log('create_company(): success.. ', res);
      resolve(res);
    }).catch(function (err) {
      console.log('create_company(): Failed to create company', err);
      reject(false);
    });
  });
}

function create_contact(details) {
  return new Promise(function (resolve, reject) {
    var payload = [
      {
        "AccountName": details.companyname,
        "FirstName": details.firstname,
        "LastName": details.lastname,
        "Phones": [
          { "PhoneType": "Personal Phone", "Phone": details.phone, "IsDefault": true }
        ],
        "Emails": [
          { "EmailType": "Work Email", "EmailAddress": details.email, "IsDefault": true }
        ],
        "Poc": true,
        "IsActive": true,
        "IsClientPortal": false
      }
    ];

    console.log('create_contact(): sending over contact');
    console.log(JSON.stringify(payload));

    var newContact = web_call2(
      "POST",
      "/api/import/contacts",
      payload
    );

    newContact.then(function (res) {
      console.log('create_contact(): success.. ', res);
      resolve(res);
    }).catch(function (err) {
      console.log('create_contact(): Failed to create contact', err);
      reject(false);
    });

  });
}

function create_opportunity(details) {
  return new Promise(function (resolve, reject) {
    var daysToAdd = 30;

    var date = new Date();
    date.setDate(date.getDate() + daysToAdd);

    var payload = [
      {
        "Subject": "Webhook sourced opportunity",
        "AccountName": details.companyname,
        "AccountLocation": "Main",
        "ContactFirstName": details.firstname,
        "ContactLastName": details.lastname,
        "Type": "Consulting", // default type
        "Probability": "0.1", // decimal
        "Rating": "Medium", // default type
        "LeadSource": "Web Site",
        "SalesRepresentativeUsername": BMS_API_USERNAME,
        "CloseDate": date.toISOString().split('T')[0],
        "Description": "A message body could go here.",
        "Status": "Open"
      }
    ];

    var newOpp = web_call2(
      "POST",
      "/api/import/opportunities",
      payload
    );

    console.log('create_opportunity(): sending over opp');
    console.log(JSON.stringify(payload));

    newOpp.then(function (res) {
      console.log('create_opportunity(): success.. ', res);
      resolve(res);
    }).catch(function (err) {
      console.log('create_opportunity(): Failed to create opp', err);
      reject(false);
    });
  });
}

module.exports.RegisterOpportunity = async (event, context) => {
  return new Promise((resolve) => {
    const customer = JSON.parse(event.body);
    console.log('RegisterOpportunity received this: \n');
    console.log(customer);

    login()
    .then((token) => {
      access_token = token;

      create_company(customer)
      .then((res) => {
        console.log("company created, moving onto contact...");
        console.log(res);

        create_contact(customer)
        .then((res) => {
          console.log("contact created");
          console.log(res);

          create_opportunity(customer)
          .then((res) => {
            console.log("opportunity created");
            console.log(res);

            resolve({
              statusCode: 200,
              body: JSON.stringify({
                message: 'successfully registered opportunity for ' + customer.companyname,
                details: customer
              })
            });
          });
        });
      });
    });
  });
};
