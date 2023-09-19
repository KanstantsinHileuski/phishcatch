// Copyright 2021 Palantir Technologies
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { getConfig } from './config'
import {
  PageMessage,
  UsernameContent,
  PasswordContent,
  DomstringContent,
  PasswordHandlingReturnValue,
  DomainType,
  AlertTypes,
  PasswordHash,
  ProtectedRoutes,
} from './types'
import { hashAndSavePassword as hashAndSavePassword, saveUsername, getHashDataIfItExists, removeHash } from './lib/userInfo'
import { checkDOMHash, saveDOMHash } from './lib/domhash'
import { showCheckmarkIfEnterpriseDomain } from './lib/showCheckmarkIfEnterpriseDomain'
import { createServerAlert } from './lib/sendAlert'
import { getDomainType } from './lib/getDomainType'
import { getHostFromUrl } from './lib/getHostFromUrl'
import { addNotification, handleNotificationClick } from './lib/handleNotificationClick'


// code is commented because async/await parts make app to crush

// export async function receiveMessage(message: PageMessage): Promise<void> {
//   switch (message.msgtype) {
//     case 'debug': {
//       break
//     }
//     case 'username': {
//       const content = <UsernameContent>message.content
//
//       if ((await getDomainType(getHostFromUrl(content.url))) === DomainType.ENTERPRISE || getHostFromUrl(content.url) ===  ProtectedRoutes[getHostFromUrl(content.url) as keyof typeof ProtectedRoutes]) {
//         await saveUsername(content.username)
//         await saveDOMHash(content.dom, content.url)
//       }
//       break
//     }
//     case 'password': {
//       const content = <PasswordContent>message.content
//       if (content.password) {
//         await handlePasswordEntry(content)
//       }
//       break
//     }
//     case 'domstring': {
//       const content = <DomstringContent>message.content
//       await checkDOMHash(content.dom, content.url)
//       break
//     }
//   }
// }

// //check if the site the password was entered into is a corporate site
// export async function handlePasswordEntry(message: PasswordContent) {
//   const url = message.url
//   const host = getHostFromUrl(url)
//   const password = message.password
//   const protectedRoute = ProtectedRoutes[host as keyof typeof ProtectedRoutes]
//
//   if ((await getDomainType(host)) === DomainType.ENTERPRISE || host === protectedRoute) {
//     if (message.save) {
//       await hashAndSavePassword(password, message.username, host)
//       return PasswordHandlingReturnValue.EnterpriseSave
//     }
//     return PasswordHandlingReturnValue.EnterpriseNoSave
//   } else if ((await getDomainType(host)) === DomainType.DANGEROUS || host !==  protectedRoute) {
//     const hashData = await getHashDataIfItExists(password)
//     if (hashData) {
//       await handlePasswordLeak(message, hashData)
//       return PasswordHandlingReturnValue.ReuseAlert
//     }
//   } else {
//     return PasswordHandlingReturnValue.IgnoredDomain
//   }
//
//   return PasswordHandlingReturnValue.NoReuse
// }
//
// async function handlePasswordLeak(message: PasswordContent, hashData: PasswordHash) {
//   const config = await getConfig()
//   const alertContent = {
//     ...message,
//     alertType: AlertTypes.REUSE,
//     associatedHostname: hashData.hostname || '',
//     associatedUsername: hashData.username || '',
//   }
//
//   void createServerAlert(alertContent)
//
//   if (config.display_reuse_alerts) {
//     const alertIconUrl = chrome.runtime.getURL('icon.png')
//     const opt: chrome.notifications.NotificationOptions = {
//       type: 'basic',
//       title: 'PhishJail Alert',
//       message: `PhishJail has detected enterprise password re-use on the url: ${message.url}\n`,
//       iconUrl: alertIconUrl,
//       requireInteraction: true,
//       priority: 2,
//       buttons: [{ title: 'This is a false positive' }, { title: `That wasn't my enterprise password` }],
//     }
//
//     chrome.notifications.create(opt, (id) => {
//       addNotification({ id, hash: hashData.hash, url: message.url })
//     })
//   }
//
//   if (config.expire_hash_on_use) {
//     await removeHash(hashData.hash)
//   }
// }



function setup() {
  console.log('background')

  chrome.runtime.onMessage.addListener(   (message, sender, sendResponse) => {
    switch (message.msgtype) {
    case 'debug': {
      break
    }
    case 'username': {
      const content = <UsernameContent>message.content
      console.log(content)
      break
    }
    case 'password': {
      const content = <PasswordContent>message.content
      console.log(content)
      break
    }
    case 'domstring': {
      const content = <DomstringContent>message.content
      console.log(content)
      break
    }
  }
  });

  // test wrapper returns promise to keep channel open
  // const wrapAsyncFunction = (listener: any) => (message:any, sender:any, sendResponse:any) => {
  //   Promise.resolve(listener(message, sender)).then(sendResponse);
  //   return true;
  // };

  // test
  // const response = new Promise(resolve => {
  //   chrome.runtime.onMessage.addListener(function listener(message) {
  //     if (message.msgtype === 'username') {
  //       resolve(message.content);
  //     }
  //   });
  // });


  // these whole chunks needed to work according docs and search results
  // chrome.runtime.onMessage.addListener(  async (message, sender, sendResponse) => {
    // new Promise(async send => {
    //   const key = await receiveMessage(message)
    //   send(key);
    // }).then(sendResponse)
    // return true;

    // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //   chrome.tabs.sendMessage(tabs[0].id!, {fileData: message}, function(response) {
    //     // console.log(response)
    //   });
    // });
    // return true

    // (async () => {
    //   const response = await receiveMessage(message)
    //   console.log(response)
    //   sendResponse(message)
    // })()
    // return true

    // receiveMessage(message).then(sendResponse).catch(e => {
    //   console.log(e)
    // })
    // return Promise.resolve("Dummy response to keep the console quiet");

    // wrapAsyncFunction(async (message:any, sender:any) => {
    //   console.log(message, sender);
    //   const response = await receiveMessage(message)
    //   return response;
    // })
  // });

  // chrome.notifications.onButtonClicked.addListener(handleNotificationClick)
  // void showCheckmarkIfEnterpriseDomain()
}

setup()
