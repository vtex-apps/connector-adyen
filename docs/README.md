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

1. Generate a Web Service API key
2. In Merchant Settings, update the Capture Delay option to `manual`
3. Create a Standard Notification webhook

- Make sure the webhook is marked as active
- Create a username and password for the webhook

### Installing the App

1. Install this app in the desired account using the CLI command `vtex install vtex.connector-adyen`.
2. In your admin sidebar, access the **Other** section and click on `Adyen` to enter the app settings.
3. In your admin sidebar, access the **Transactions** section and click `Payments > Settings`.
4. Click the `Gateway Affiliations` tab and click the green plus sign to add a new affiliation.
5. Click `` from the **Others** list.
6. Modify the `Affiliation name` if desired, choose an `Auto Settlement` behavior from the dropdown and then click `Save`. Leave `Application Key` and `Application Token` blank.
7. Click the `Payment Conditions` tab and click the green plus sign to add a new payment condition.
8. From the **Credit Card** list, click the card type you want to process using Adyen.
9. In the `Process with affiliation` dropdown, choose `` or the name of the affiliation that you created in step 6. Set the status to `Active` and click `Save`. Note that this will activate the payment method in checkout!
10. Repeat steps 8 and 9 for each credit type to be processed with Adyen.

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
