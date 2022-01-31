📢 Use this project, [contribute](https://github.com/vtex-apps/connector-adyen) to it or open issues to help evolve it using [Store Discussion](https://github.com/vtex-apps/store-discussion).

# Adyen

<!-- DOCS-IGNORE:start -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- DOCS-IGNORE:end -->

This app integrates Adyen with VTEX checkout.

## Configuration

### Adyen Setup

Before you can configure the VTEX Adyen connector, you will need to do the following setup in your Adyen merchant account:

1. Generate Web Service API credentials.
   - Under the Developers tab, select `API credentials`
   - Select `Webservice`
   - Keep `Username` and `Password` somewhere safe
   - Generate a new API Key and store it somewhere safe. This can be regenerated if lost
2. (Do Only Once) Send an email to Adyen support (suporte@adyen.com), requesting the permissions listed in the model below:
   - Subject: Setting VTEX web-service user permissions for {accountName}
   - Email Body: Adyen Support, I send this email to ask you to grant the necessary permissions to the user username@Company.companyname so that it can be used on the VTEX platform. Thank you in advance!
3. In Merchant Settings, update the Capture Delay option to `manual`. This allows VTEX to handle payment capture timing.
4. Create a Standard Notification Webhook
   - Use `https://{accountName}.myvtex.com/_v/api/connector-adyen/v0/hook` for the URL
      - Example: `https://mysampleshop.myvtex.com/_v/api/connector-adyen/v0/hook`
   - Make sure `Service Version` is `1`
   - Make sure the webhook is marked as `active`
   - Make sure `Method` is set to `JSON`
   - Create a `username` and `password` of your choice for the webhook events

### Installing the App

1. Install this app in the desired account using the CLI command `vtex install vtex.connector-adyen`.
2. In your admin sidebar, access the **Transactions** section and click `Payments > Settings`.
3. Click the `Gateway Affiliations` tab and click the green plus sign to add a new affiliation.
4. Select `Adyen Payments` from the **Others** list.
5. Modify the `Affiliation name` if desired, choose an `Auto Settlement` behavior from the dropdown and then click `Save`. Leave `Application Key` and `Application Token` blank.
6. Click the `Payment Conditions` tab and click the green plus sign to add a new payment condition.
7. From the **Credit Card** list, click the card type you want to process using Adyen.
8. In the `Process with affiliation` dropdown, choose `Adyen Payments` or the name of the affiliation that you created in step 6. Set the status to `Active` and click `Save`. Note that this will activate the payment method in checkout!
9. Repeat steps 8 and 9 for each credit type to be processed with Adyen.
10. In your admin sidebar, access the **Other** section and click on `Adyen Payments` to enter the app settings.
11. Complete the settings with the values from your Adyen setup.


### App Configurations

1. `Adyen Merchant Account` is the merchant account name. 
   - Note: This is not the company name.
2. `Adyen API Key` is the API key that is generated in Step 1 of `Adyen Setup`
3. `Adyen Production API URI` is the Checkout API's URI.
   - This can be found in the Developer > API URLs tab in Adyen.
   - Example: `http://checkout-test.adyen.com`
   - Note: Please use http instead of https
4. `Adyen Webhook Username` and `Adyen Webhook Password` is the Username/Password created in Step 4 of `Adyen Setup`
5. `VTEX App Key/App Token` are app keys/tokens that can found here: `https://{accountName}.myvtex.com/admin/appkeys`

<!-- DOCS-IGNORE:start -->

## Contributors ✨

Thanks goes to these wonderful people:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome!

<!-- DOCS-IGNORE:end -->
