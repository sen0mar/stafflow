const unauthorizedEventName = 'stafflow:unauthorized'

export const notifyUnauthorized = () => {
  window.dispatchEvent(new Event(unauthorizedEventName))
}

export const subscribeToUnauthorized = (listener: () => void) => {
  window.addEventListener(unauthorizedEventName, listener)

  return () => window.removeEventListener(unauthorizedEventName, listener)
}
