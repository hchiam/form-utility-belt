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
  showProgressBar: false,
};

export async function getData(callback) {
  return await chrome.storage.local.get("data", (storageData) => {
    let updatedData = { ...defaultData };
    if (storageData && storageData.data) updatedData = storageData.data;
    if (callback) callback(updatedData);
  });
}

export async function setData(data, callback) {
  return await chrome.storage.local.set({ data: data }).then(() => {
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
    const allowedValuesForSlot = allAllowedValues[i]; // TODO: not getting the right ones?
    const value = currentValues[i];
    const valueIndex = allowedValuesForSlot.indexOf(value);
    comboNumber += valueIndex > -1 ? valueIndex * multiplier : 0;
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
      remainingAllowedValues.push(values.slice(-1));
    } else {
      const index =
        lastIndexToHitEnd === i - 1 ? values.indexOf(currentValues[i]) : 0;
      const sliceStart = lastIndexToHitEnd >= i ? remainder + 1 : index;
      remainingAllowedValues.push(values.slice(sliceStart));
    }
    quotient = Math.floor(quotient / values.length);
  }
  return remainingAllowedValues.reverse();
}

/** original reference: https://github.com/hchiam/learning-js/blob/main/beep.js */
export function beep() {
  const sound = new Audio(
    "data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU="
  );
  sound.play();
}
