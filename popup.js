// this runs in the popup when you click on the extension icon

const defaultHostnames = ["surge.sh"];

let data = {
  hostnames: [...defaultHostnames],
  submit_selector: '[type="submit"]',
  record: "",
  recordIndex: 0,
  summary: "",
  continueAutomation: false,
};

const hostnamesElement = document.querySelector("#hostnames");
const submitSelectorElement = document.querySelector("#submit_selector");
const combosElement = document.querySelector("#combos");
const recordElement = document.querySelector("#record");
const summaryElement = document.querySelector("#summary");

initializeData();
initializeEventsInsidePopupUI();
chrome.tabs.query({ active: true, currentWindow: true }, (tabData) => {
  const tabHostnames = getHostnamesFromUrlListString(tabData[0].url);
  enableBasedOnHostnames(tabHostnames);
});

function initializeEventsInsidePopupUI() {
  hostnamesElement.addEventListener("keyup", () => {
    let hostnames =
      [hostnamesElement.value.replaceAll(" ", "")] || defaultHostnames;
    hostnames = getHostnamesFromUrlListString(hostnames.join(","));
    data.hostnames = hostnames;
    hostnamesElement.value = hostnames.join(",");
    setData(data);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabData) => {
      const tabHostnames = getHostnamesFromUrlListString(tabData[0].url);
      enableBasedOnHostnames(tabHostnames);
    });
  });
  submitSelectorElement.addEventListener("keyup", () => {
    const defaultSubmitSelector = "[type='submit']";
    data.submit_selector = submitSelectorElement.value || defaultSubmitSelector;
    setData(data);
  });
  combosElement.addEventListener("click", () => {
    let yes = true;
    if (!data.continueAutomation) {
      yes = confirm(
        `Do you still want to continue?

WARNING:  This will automatically try all combinations of values for the elements on this page, and may continue running even if the page refreshes. To stop it, hit the "PAUSE trying all combinations" button. 

Do you still want to continue?`
      );
    }
    if (yes) {
      window.close();
      data.continueAutomation = !data.continueAutomation;
      combosElement.innerText = data.continueAutomation
        ? "Try all combinations"
        : "PAUSE trying all combinations";
      setData(data);
      combos();
    }
  });
  recordElement.addEventListener("keyup", (event) => {
    data.record = recordElement.innerText;
    setData(data);
    if (event.key === "Enter" && data.record) {
      copyToClipboard(data.record, () => {
        alert(`Copied JS recording to clipboard.`);
        window.close();
      });
    }
  });
  recordElement.addEventListener("click", () => {
    if (data.record) {
      copyToClipboard(data.record, () => {
        alert(`Copied JS recording to clipboard.`);
        window.close();
      });
    }
  });
  summaryElement.addEventListener("keyup", (event) => {
    data.summary = summaryElement.innerText;
    setData(data);
    if (event.key === "Enter" && data.summary) {
      copyToClipboard(data.summary, () => {
        alert(`Copied summary to clipboard.`);
        window.close();
      });
    }
  });
  summaryElement.addEventListener("click", () => {
    if (data.summary) {
      copyToClipboard(data.summary, () => {
        alert(`Copied summary to clipboard.`);
        window.close();
      });
    }
  });
}

function initializeData(callback) {
  getData(() => {
    hostnamesElement.value = data.hostnames.join(",") || defaultHostnames;
    submitSelectorElement.value = data.submit_selector;
    combosElement.innerText = data.continueAutomation
      ? "PAUSE trying all combinations"
      : "Try all combinations";
    recordElement.innerText = data.record;
    summaryElement.innerText = data.summary;
    if (callback) callback();
  });
}

/** param hostnames must be an array */
function enableBasedOnHostnames(hostnames) {
  const disable = !isAllowedHostname(hostnames);
  submitSelectorElement.disabled = disable;
  combosElement.disabled = disable;
  recordElement.disabled = disable;
  summaryElement.disabled = disable;
}

/** param hostnames must be an array */
function isAllowedHostname(hostnames) {
  if (!Array.isArray(hostnames)) return false;
  if (data.hostnames[0] === "*") return true;
  for (let checkingHostname of hostnames) {
    for (let allowedHostName of data.hostnames) {
      if (checkingHostname === allowedHostName) return true;
    }
  }
  return false;
}

function getData(callback) {
  chrome.storage.local.get("data", (storageData) => {
    if (storageData && storageData.data) data = storageData.data;
    if (callback) callback();
  });
}

function setData(data) {
  chrome.storage.local.set({ data: data });
}

function getHostnamesFromUrlListString(urlString) {
  return urlString.split(",").map((url) => getHostnameFromUrl(url));
}

function getHostnameFromUrl(url) {
  if (!url) return "";
  let hostname = url;
  hostname = hostname.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const hasMultipleDots = hostname.match(/\./g)?.length > 1;
  if (hasMultipleDots) {
    hostname = hostname.replace(/.+\.(?=.*\.)/g, ""); // keep only the last "."
  }
  hostname = hostname.replace(/\/.+/, "");
  return hostname;
}

function combos() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabData) => {
    const activeTab = tabData[0];
    chrome.tabs.sendMessage(activeTab.id, {
      message: "combos",
    });
  });
}

/** original reference: https://github.com/hchiam/clipboard */
function copyToClipboard(text, callback) {
  try {
    navigator.clipboard
      .writeText(text) // if not IE
      .catch(function (err) {
        alert(
          "Could not automatically copy to clipboard. \n\n Manually copy this text instead: \n\n" +
            text
        );
        console.log(err);
      });
    setTimeout(() => {
      if (callback) callback(text);
    }, 100);
  } catch (e) {
    try {
      var temp = document.createElement("textarea");
      document.body.append(temp);
      temp.value = text;
      temp.select();
      document.execCommand("copy");
      temp.remove();
      setTimeout(() => {
        if (callback) callback(text);
      }, 100);
    } catch (err) {
      alert(
        "Could not automatically copy to clipboard. \n\n Manually copy this text instead: \n\n" +
          text
      );
      console.log(err);
    }
  }
}
