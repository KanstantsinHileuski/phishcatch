import { getHostFromUrl } from "./getHostFromUrl";
import {
  AlertTypes,
  DomainType,
  PasswordContent,
  PasswordHandlingReturnValue,
  PasswordHash,
  ProtectedRoutes
} from "../types";
import { getDomainType } from "./getDomainType";
import { getHashDataIfItExists, hashAndSavePassword, removeHash } from "./userInfo";
import { getConfig } from "../config";
import { createServerAlert } from "./sendAlert";

export async function handlePasswordEntry(message: PasswordContent) {
  const url = message.url
  const host = getHostFromUrl(url)
  const password = message.password
  const protectedRoute = ProtectedRoutes[host as keyof typeof ProtectedRoutes]

  if ((await getDomainType(host)) === DomainType.ENTERPRISE || host === protectedRoute) {
    if (message.save) {
      await hashAndSavePassword(password, message.username, host)
      return PasswordHandlingReturnValue.EnterpriseSave
    }
    return PasswordHandlingReturnValue.EnterpriseNoSave
  } else if ((await getDomainType(host)) === DomainType.DANGEROUS || host !==  protectedRoute) {
    const hashData = await getHashDataIfItExists(password)
    if (hashData) {
      await handlePasswordLeak(message, hashData)
      return PasswordHandlingReturnValue.ReuseAlert
    }
  } else {
    return PasswordHandlingReturnValue.IgnoredDomain
  }

  return PasswordHandlingReturnValue.NoReuse
}

async function handlePasswordLeak(message: PasswordContent, hashData: PasswordHash) {
  const config = await getConfig()
  const alertContent = {
    ...message,
    alertType: AlertTypes.REUSE,
    associatedHostname: hashData.hostname || '',
    associatedUsername: hashData.username || '',
  }

  void createServerAlert(alertContent)

  if (config.display_reuse_alerts) {
      const alertIconUrl = chrome.runtime.getURL('icon.png')
      const opt: chrome.notifications.NotificationOptions = {
        type: 'basic',
        title: 'PhishJail Alert',
        message: `PhishJail has detected enterprise password re-use on the url: ${message.url}\n`,
        iconUrl: alertIconUrl,
        requireInteraction: true,
        priority: 2,
        buttons: [{title: 'This is a false positive'}, {title: `That wasn't my enterprise password`}],
      }

      chrome.runtime.sendMessage({
        msgtype: 'notification',
        content: {
          opt,
          hashData,
          url: message.url
        }
      })
  }

  if (config.expire_hash_on_use) {
    await removeHash(hashData.hash)
  }
}
