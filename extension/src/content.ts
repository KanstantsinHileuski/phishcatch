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

import { debounce } from './content-lib/debounce'
import { getSanitizedUrl } from './lib/getSanitizedUrl'
import { getDomainType } from './lib/getDomainType'
import { DomainType, PasswordContent, ProtectedRoutes, UsernameContent } from './types'
import { getConfig } from './config'
import { isBannedUrl, setBannedMessage } from './content-lib/bannedMessage'
import { getHostFromUrl } from "./lib/getHostFromUrl";

// wait for page to load before doing anything
function ready(callbackFunc: () => void) {
  if (document.readyState !== 'loading') {
    callbackFunc()
  } else if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', callbackFunc)
  }
}

function runMSUsernameScraper() {
  if (window.location.hostname === ProtectedRoutes[window.location.hostname as keyof typeof ProtectedRoutes]) {
    const displayNameNode = document.getElementById('displayName')
    if (displayNameNode && displayNameNode.textContent) {
      void saveUsername(displayNameNode.textContent)
      return displayNameNode.textContent
    }
  }
}

async function scrapeUsernames(): Promise<string | undefined> {
  const config = await getConfig()

  const detectedUsername = runMSUsernameScraper()
  if (detectedUsername) {
    return detectedUsername
  }

  // return the first detected username for password/username pair purposes
  // saves all detected usernames as potential user IDs
  return new Promise((resolve) => {
    config.username_selectors.forEach((selector) => {
      const usernameNode = document.querySelector(selector)
      if (usernameNode && usernameNode.nodeName === 'input') {
        const usernameFormNode = <HTMLInputElement>usernameNode
        if (usernameFormNode.value && usernameFormNode.type !== 'password') {
          void saveUsername(usernameFormNode.value)
          resolve(usernameFormNode.value)
        }
      } else if (usernameNode && usernameNode.textContent) {
        void saveUsername(usernameNode.textContent)
        resolve(usernameNode.textContent)
      }
    })

    resolve(undefined)
  })
}

// Send the password to the background script to be hashed and compared
async function checkPassword(password: string, save: boolean) {
  let username: string | undefined
  if (save) {
    username = await scrapeUsernames()
  }

  console.log(username, password)

  const content: PasswordContent = {
    password,
    username,
    save,
    url: await getSanitizedUrl(location.href),
    referrer: await getSanitizedUrl(document.referrer),
    timestamp: new Date().getTime(),
  };

  chrome.runtime.sendMessage({
    msgtype: 'password',
    content,
  })

  // test
  // try{
  //   chrome.runtime.sendMessage({
  //     msgtype: 'password',
  //     content,
  //   }, function (response) {
  //     console.log(response);
  //   })
  // }catch (e) {
  //   console.log(e)
  // }
}

// Send username to the background script to be saved
async function saveUsername(username: string) {
  if (typeof username !== 'string') {
    return
  }

  const content: UsernameContent = {
    username,
    url: await getSanitizedUrl(location.href),
    dom: document.getElementsByTagName('body')[0].innerHTML,
  };

  chrome.runtime.sendMessage({
    msgtype: 'username',
    content,
  });

  //test
  // try {
  //   chrome.runtime.sendMessage({
  //     msgtype: 'username',
  //     content,
  //   }, function (response) {
  //     console.log(response);
  //   })
  // }catch (e) {
  //   console.log(e)
  // }
}

function entepriseFormSubmissionTrigger(event: KeyboardEvent) {
  if (event.key == 'U+000A' || event.key == 'Enter' || event.keyCode == 13) {
    const target = event.target as HTMLInputElement
    if (target.nodeName === 'INPUT' && target.type === 'password') {
      void checkPassword(target.value, true)
    }
    return false
  }
}

function enterpriseFocusOutTrigger(event: FocusEvent) {
  const target = event.target as HTMLInputElement
  if (target.nodeName === 'INPUT' && target.type === 'password') {
    void checkPassword(target.value, true)
  }
}

// Debounce password checks to avoid hashing the password on every single input
// const debouncedCheckPassword = debounce(checkPassword, 100)

function inputChangedTrigger(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.nodeName === 'INPUT' && target.type === 'password') {
    void checkPassword(target.value, true)
  }
}

async function checkDomHash() {
  const content = {
    dom: document.getElementsByTagName('body')[0].innerHTML,
    url: await getSanitizedUrl(location.href),
  };

  // Working example
  chrome.runtime.sendMessage({
    msgtype: 'domstring',
    content: {
      dom: document.getElementsByTagName('body')[0].innerHTML,
      url: await getSanitizedUrl(location.href),
    },
  })

  //test
  // chrome.runtime.sendMessage({msgtype: "domstring", content}, function (response) {
  //   console.log(response)
  // })

  //test
  // ( async () =>{
  //   const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  //   const response = await chrome.tabs.sendMessage( tab.id, {msgtype: "domstring", content});
  //   console.log(response);
  // })();

  //test
  // return new Promise((resolve, reject) => {
  //     chrome.tabs.query({currentWindow: true, active: true}, (tab) => {
  //       chrome.tabs.sendMessage(tab[0].id!, {msgtype: "domstring", content}, response => {
  //         if (response.complete) {
  //           resolve('');
  //         } else {
  //           reject('Something wrong');
  //         }
  //       });
  //     })
  // });
}

async function checkIfUrlBanned() {
  if (await isBannedUrl(window.location.href)) {
    setBannedMessage()
  }
}

ready(async() => {
  const host = getHostFromUrl(window.location.href);

  console.log('content', await getDomainType(host), host);
  if (await getDomainType(host) === DomainType.ENTERPRISE || host === ProtectedRoutes[host as keyof typeof ProtectedRoutes]) {
    document.addEventListener('focusout', enterpriseFocusOutTrigger, true)
    document.addEventListener('keydown', entepriseFormSubmissionTrigger, true)
    void checkDomHash()
  } else if ((await getDomainType(host)) === DomainType.DANGEROUS) {
    document.addEventListener('input', inputChangedTrigger, true)
    void checkDomHash()
  }
})

checkIfUrlBanned()