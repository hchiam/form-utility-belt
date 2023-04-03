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
  submitRetriesLeft: 1,
  comboCount: 0,
  comboAt: 0,
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

export function getComboNumberFromValues(currentValues, allAllowedValues) {
  let comboNumber = 0;
  let multiplier = 1;

  for (let i = currentValues.length - 1; i >= 0; i--) {
    const allowedValuesForSlot = allAllowedValues[i];
    const value = currentValues[i];
    const valueIndex = allowedValuesForSlot.indexOf(value);
    comboNumber += valueIndex * multiplier;
    multiplier *= allowedValuesForSlot.length;
  }

  return comboNumber;
}

export function getValuesFromComboNumber(comboNumber, allAllowedValues) {
  const values = [];
  let factor = 1;

  for (let i = allAllowedValues.length - 1; i >= 0; i--) {
    factor *= allAllowedValues[i].length;
  }

  for (let i = 0; i < allAllowedValues.length; i++) {
    factor /= allAllowedValues[i].length;
    const index = Math.floor(comboNumber / factor) % allAllowedValues[i].length;
    values.push(allAllowedValues[i][index]);
  }

  return values;
}

export function getRemainingAllowedValuesFromComboNumber(
  comboNumber,
  allAllowedValues
) {
  if (comboNumber < 0) return allAllowedValues;

  const currentValues = getValuesFromComboNumber(comboNumber, allAllowedValues);

  const remainingAllowedValues = [];
  let quotient = comboNumber;
  let lastIndexToHitEnd = -1;
  let minComboNumberOfLastAllowedValue = 0;
  for (let i = 0; i < allAllowedValues.length; i++) {
    let temp = 1;
    for (let j = i + 1; j < allAllowedValues.length; j++) {
      temp *= allAllowedValues[j].length;
    }
    let keep = allAllowedValues[i].length - 1;
    minComboNumberOfLastAllowedValue += keep;
    minComboNumberOfLastAllowedValue *= temp;
    if (comboNumber >= minComboNumberOfLastAllowedValue) {
      lastIndexToHitEnd = i;
    } else if (lastIndexToHitEnd === i - 1) {
      const indexOfValue = allAllowedValues[i].indexOf(currentValues[i]);
      const isLastValue = indexOfValue === allAllowedValues[i].length - 1;
      if (isLastValue) {
        lastIndexToHitEnd = i;
      }
    }
  }

  for (let i = allAllowedValues.length - 1; i >= 0; i--) {
    const values = allAllowedValues[i];
    const remainder = quotient % values.length;
    if (remainder === values.length - 1 && lastIndexToHitEnd >= i) {
      remainingAllowedValues.unshift(values.slice(-1));
    } else {
      const index =
        lastIndexToHitEnd === i - 1 ? values.indexOf(currentValues[i]) : 0;
      const sliceStart = lastIndexToHitEnd >= i ? remainder + 1 : index;
      remainingAllowedValues.unshift(values.slice(sliceStart));
    }
    quotient = Math.floor(quotient / values.length);
  }
  return remainingAllowedValues; // TODO: replace unshift with .push and .reverse()
}
