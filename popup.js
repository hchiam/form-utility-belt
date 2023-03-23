// this runs in the popup when you click on the extension icon

let data = {
  hostname: "*",
  submit_selector: "[type='submit']",
  record: "",
  summary: "",
};

const defaultHostname = "*";
let timesHitCopyToClipboard = 0;

const hostnameElement = document.querySelector("#hostname");
const submitSelectorElement = document.querySelector("#submit_selector");
const combosElement = document.querySelector("#combos");
const recordElement = document.querySelector("#record");
const summaryElement = document.querySelector("#summary");

initializeData();
initializeEventsInsidePopupUI();
chrome.tabs.query({ active: true, currentWindow: true }, (tabData) => {
  const hostname = getHostnameFromUrl(tabData[0].url);
  enableBasedOnHostname(hostname);
});

function initializeEventsInsidePopupUI() {
  hostnameElement.addEventListener("keyup", () => {
    let hostname = hostnameElement.value || defaultHostname;
    hostname = getHostnameFromUrl(hostname);
    data.hostname = hostname;
    hostnameElement.value = hostname;
    setData(data);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabData) => {
      const hostname = getHostnameFromUrl(tabData[0].url);
      enableBasedOnHostname(hostname);
    });
  });
  submitSelectorElement.addEventListener("keyup", () => {
    const defaultSubmitSelector = "[type='submit']";
    data.submit_selector = submitSelectorElement.value || defaultSubmitSelector;
    setData(data);
  });
  recordElement.addEventListener("keyup", (event) => {
    data.record = recordElement.innerText;
    setData(data);
    if (event.key === "Enter" && data.record) {
      copyToClipboard(data.record, () => {
        alert(`Copied to clipboard (x${timesHitCopyToClipboard})`);
        window.close();
      });
    }
  });
  recordElement.addEventListener("click", () => {
    if (data.record) {
      copyToClipboard(data.record, () => {
        alert(`Copied to clipboard (x${timesHitCopyToClipboard})`);
        window.close();
      });
    }
  });
  summaryElement.addEventListener("keyup", (event) => {
    data.summary = summaryElement.innerText;
    setData(data);
    if (event.key === "Enter" && data.summary) {
      copyToClipboard(data.summary, () => {
        alert(`Copied to clipboard (x${timesHitCopyToClipboard})`);
        window.close();
      });
    }
  });
  summaryElement.addEventListener("click", () => {
    if (data.summary) {
      copyToClipboard(data.summary, () => {
        alert(`Copied to clipboard (x${timesHitCopyToClipboard})`);
        window.close();
      });
    }
  });
}

function initializeData() {
  getData(() => {
    hostnameElement.value = data.hostname;
    submitSelectorElement.value = data.submit_selector;
    recordElement.innerText = data.record;
    summaryElement.innerText = data.summary;
    enableBasedOnHostname(data.hostname);
  });
}

function enableBasedOnHostname(hostname) {
  submitSelectorElement.disabled = !hasSameHostname(hostname);
  combosElement.disabled = !hasSameHostname(hostname);
  recordElement.disabled = !hasSameHostname(hostname);
  summaryElement.disabled = !hasSameHostname(hostname);
}

function hasSameHostname(hostname) {
  return hostname === "*" || data.hostname.endsWith(hostname);
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

function getHostnameFromUrl(url) {
  if (!url) return defaultHostname;
  let hostname = url;
  hostname = hostname.replace(/^https?:\/\//, "").replace(/\/$/, "");
  // const hasMultipleDots = hostname.match(/\./g).length > 1;
  // if (hasMultipleDots) {
  //   hostname = hostname.replace(/\.(?=.*\.)/g, ""); // keep only the last "."
  // }
  hostname = hostname.replace(/\/.+/, "");
  return hostname;
}

/** original reference: https://github.com/hchiam/clipboard */
function copyToClipboard(text, callback) {
  timesHitCopyToClipboard++;
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
