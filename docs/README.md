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
2. In Merchant Settings, update the Capture Delay option to `manual`. This allows VTEX to handle payment capture timing.
3. Create a Standard Notification webhook
   - Make sure the webhook is marked as active
   - Create a username and password for the webhook events

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
