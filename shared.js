export const defaultHostnames = ["surge.sh"];
export const defaultSubmitSelector = '[type="submit"]';

export const defaultData = {
  hostnames: [...defaultHostnames],
  submit_selector: defaultSubmitSelector,
  submit_combos: false,
  record: "",
  recordIndex: 0,
  summary: "",
  continueAutomation: false,
};

export function getData(callback) {
  chrome.storage.local.get("data", (storageData) => {
    let updatedData = { ...defaultData };
    if (storageData && storageData.data) updatedData = storageData.data;
    if (callback) callback(updatedData);
  });
}

export function setData(data, callback) {
  chrome.storage.local.set({ data: data }).then(() => {
    if (callback) callback();
  });
}

/** param hostnames must be an array */
export function isAllowedHostname(hostnames, allowedHostnames) {
  if (!Array.isArray(hostnames)) return false;
  if (allowedHostnames.includes("*")) return true;
  for (let checkingHostname of hostnames) {
    for (let allowedHostName of allowedHostnames) {
      if (checkingHostname.endsWith(allowedHostName)) return true;
    }
  }
  return false;
}

export function getHostnameFromUrl(url) {
  if (!url) return "";
  let hostname = url;
  hostname = hostname
    .replace(/^https?:/, "")
    .replace(/^\/\//, "")
    .replace(/:\d*\/?.*/, "")
    .replace(/\/$/, "");
  // const hasMultipleDots = hostname.match(/\./g)?.length > 1;
  // if (hasMultipleDots) {
  //   hostname = hostname.replace(/.+\.(?=.*\.)/g, ""); // keep only the last "."
  // }
  hostname = hostname.replace(/\/.+$/, "");
  return hostname;
}
