export const randomString = () => {
  return Math.random()
    .toString(36)
    .substring(7)
}

export const randomUrl = () => {
  return `https://${randomString()}.com`
}

export const priceInCents = (value: number) => {
  return Math.round(value * 100)
}
