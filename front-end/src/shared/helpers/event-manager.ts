type Listner = (payload: any) => void

class EventManager {
  private eventListeners: Map<string, Listner[]>
  constructor() {
    this.eventListeners = new Map<string, Listner[]>()
  }
  subscribe(eventName: string, listener: Listner) {
    const existingListeners = this.eventListeners.get(eventName) ?? []
    this.eventListeners.set(eventName, [...existingListeners, listener])

    /** unsubscription */
    return () => {
      const existingListeners = this.eventListeners.get(eventName) ?? []
      this.eventListeners.set(
        eventName,
        existingListeners.filter((l) => l !== listener)
      )
    }
  }
  emit(eventName: string, payload: any) {
    this.eventListeners.get(eventName)?.forEach((listner) => {
      listner(payload)
    })
  }
}

export const EventManagerInstance = new EventManager()
