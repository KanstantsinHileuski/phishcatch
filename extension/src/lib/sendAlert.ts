import { getConfig } from '../config'
import { AlertContent, AlertTypes } from '../types'
import { getUsernames } from './userInfo'
import { getId } from './clientId'

interface Alert {
  allAssociatedUsernames: string
  alertUrl: string
  alertTimestamp: number
  clientId: string
  suspectedUsername?: string
  suspectedHost?: string
  referrer?: string
  alertType: AlertTypes
  userAgent: string
  IP: string
}

interface UnsentAlert {
  alert: Alert
  tries: number
}

export async function getUnsentAlerts(): Promise<UnsentAlert[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get('unsentAlerts', (data) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const unsentAlerts: UnsentAlert[] = data.unsentAlerts || []
      resolve(unsentAlerts)
    })
  })
}

export async function saveUnsentAlert(newUnsentAlert: UnsentAlert) {
  let unsentAlerts = await getUnsentAlerts()
  const isOldAlert = unsentAlerts.some((currentAlert) => currentAlert.alert.alertTimestamp === newUnsentAlert.alert.alertTimestamp)
  if (isOldAlert) {
    unsentAlerts = unsentAlerts.map((currentAlert) => {
      if (currentAlert.alert.alertTimestamp === newUnsentAlert.alert.alertTimestamp) {
        currentAlert = newUnsentAlert
      }

      return currentAlert
    })
  } else {
    unsentAlerts.push(newUnsentAlert)
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ unsentAlerts }, () => {
      resolve(true)
    })
  })
}

export async function sendAlert(alert: Alert) {
  const config = await getConfig()
  const url_alert = `${config.phishJail_server}/alert`

  try {
    const response = await fetch(url_alert, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_API_KEY!,
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(alert),
    })
    if (response.status === 200) {
      return true
    } else {
      return false
    }
  } catch (error) {
    return false
  }
}

export async function createServerAlert(message: AlertContent) {
  const config = await getConfig()
  const res = await fetch('https://api.ipify.org/')
  const IP = await res.text()

  if (!config.phishJail_server) {
    return false
  }

  if (checkIfDup(message)) {
    return false
  }

  const data: Alert = {
    alertUrl: message.url,
    allAssociatedUsernames: '',
    referrer: message.referrer,
    alertTimestamp: message.timestamp,
    alertType: message.alertType,
    suspectedUsername: message.associatedUsername,
    suspectedHost: message.associatedHostname,
    clientId: await getId(),
    userAgent: navigator.userAgent,
    IP
  }

  const usernames = (await getUsernames()).map((username) => username.username)

  data.allAssociatedUsernames = JSON.stringify(usernames)

  const sentAlert = await sendAlert(data)
  if (!sentAlert) {
    void saveUnsentAlert({
      alert: data,
      tries: 1,
    })
  }

  return data
}

export function checkIfDup(message: AlertContent) {
  const thirtySeconds = 30 * 1000

  const dupCheckString = JSON.stringify({
    url: message.url,
    alertType: message.alertType,
    username: message.associatedUsername,
    hostname: message.associatedHostname,
  })

  if (recentAlerts.has(dupCheckString)) {
    const dupDate = recentAlerts.get(dupCheckString)
    if (!dupDate) {
      throw 'no date'
    }

    if (new Date().getTime() - dupDate.getTime() < thirtySeconds) {
      return true
    } else {
      recentAlerts.delete(dupCheckString)
    }
  } else {
    recentAlerts.set(dupCheckString, new Date())
  }

  return false
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
let recentAlerts: Map<string, Date> = new Map()

setTimeout(() => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  recentAlerts = new Map()
}, 24 * 60 * 60 * 1000)
