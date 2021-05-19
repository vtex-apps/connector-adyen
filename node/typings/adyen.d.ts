interface AdyenPaymentResponse {
  action?: Action
  additionalData?: any
  amount: Amount
  donationToken?: string
  fraudResult?: any
  merchantReference: string
  order?: any
  pspReference: string
  refusalReason?: string
  refusalReasonCode?: string
  resultCode: ResultCode
  threeDS2Result?: any
}

type ResultCode =
  | 'AuthenticationFinished'
  | 'AuthenticationNotRequired'
  | 'Authorised'
  | 'Cancelled'
  | 'ChallengeShopper'
  | 'Error'
  | 'IdentifyShopper'
  | 'Pending'
  | 'PresentToShopper'
  | 'Received'
  | 'RedirectShopper'
  | 'Refused'
type Action = CheckoutAwaitAction

interface CheckoutAwaitAction {
  paymentData: string
  paymentMethodType: string
  type: 'await'
  url: string
}

// interface AdyenPaymentMethodResponse {
//   paymentMethods: any[]
//   storedPaymentMethods: any[]
// }

// interface AdyenPaymentMethod {
//   merchantAccount: string
//   allowedPaymentMethods?: string[]
//   amount?: Amount
//   blockedPaymentMethods?: string[]
//   channel?: string
//   countryCode: string
//   order: Order
//   shopperLocale: string
//   shopperReference: string
//   splitCardFundingSources: string
//   store: string
// }

interface AdyenPayment {
  merchantAccount: string
  amount: Amount
  reference: string
  paymentMethod: PaymentMethod
  returnUrl: string
}

interface Amount {
  currency: string
  value: number
}

// interface Order {
//   orderData: string
//   pspReference: number
// }

interface PaymentType {
  type: string
}

interface AdyenCard extends PaymentType {
  number: string
  expiryMonth: string
  expiryYear: string
  cvc: string
  holderName?: string
}

type PaymentMethod = AdyenCard

interface AdyenModificationRequest {
  merchantAccount: string
  originalReference: string
  additionalData?: any
  mpiData?: any
  originalMerchantReference?: string
  reference?: string
  splits?: Split[]
  tenderReference?: string
  uniqueTerminalId?: string
}

interface AdyenRefundRequest extends AdyenModificationRequest {
  modificationAmount: any
}

interface AdyenCaptureRequest extends AdyenModificationRequest {
  modificationAmount: any
}

interface AdyenSplit {
  account?: string
  amount: Amount
  description?: string
  reference?: string
  type: string
}

interface AdyenModificationResponse {
  pspReference: string
  response: string
  additionalData?: string
}
