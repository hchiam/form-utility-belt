// this runs on the current page

let data = {
  hostnames: ["*"],
  submit_selector: '[type="submit"]',
  record: "",
  recordIndex: 0,
  summary: "",
  continueAutomation: false,
};

const recordPrefix = `$=document.querySelector.bind(document);
async function sleep(ms){await new Promise(r=>setTimeout(r,ms||100));};`;
$ = document.querySelector.bind(document);
$$ = document.querySelectorAll.bind(document);
async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms || 100));
}

setEverythingUp();

function setEverythingUp() {
  getData(() => {
    if (hasAllowedHostname()) {
      reinitializeRecordUponFirstInteraction();
      if (data.continueAutomation) {
        continueAutomation();
      } else {
        record();
      }
    }
  });
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

function hasAllowedHostname() {
  return isAllowedHostname([getHostnameFromUrl(location.hostname)]);
}

/** param hostnames must be an array */
function isAllowedHostname(hostnames) {
  if (!Array.isArray(hostnames)) return false;
  if (hostnames[0] === "*") return true;
  for (let checkingHostname of hostnames) {
    for (let allowedHostName of data.hostnames) {
      if (checkingHostname === allowedHostName) return true;
    }
  }
  return false;
}

function getHostnameFromUrl(url) {
  if (!url) return "";
  let hostname = url;
  hostname = hostname.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const hasMultipleDots = hostname.match(/\./g).length > 1;
  if (hasMultipleDots) {
    hostname = hostname.replace(/.+\.(?=.*\.)/g, ""); // keep only the last "."
  }
  hostname = hostname.replace(/\/.+/, "");
  return hostname;
}

function reinitializeRecordUponFirstInteraction() {
  Array.from(document.querySelectorAll("*")).forEach((element) =>
    element.addEventListener("change", reinitializeRecord)
  );
}

function reinitializeRecord() {
  data.record = recordPrefix;
  data.recordIndex = 0;
  data.summary = "";
  setData(data);
  log("\n\nNew recording started.\n\n\n");
  Array.from(document.querySelectorAll("*")).forEach((element) =>
    element.removeEventListener("change", reinitializeRecord)
  );
}

function record() {
  Array.from(document.querySelectorAll("*")).forEach((element) =>
    element.addEventListener("change", handleChangesInAnyElement)
  );

  function handleChangesInAnyElement(event) {
    const isUserGenerated = event.isTrusted;
    if (!isUserGenerated) return;

    const wasTriggeredOnThisElement = event.target === this;
    if (!wasTriggeredOnThisElement) return;

    const element = this;

    const isHidden =
      element.style.visibility === "hidden" || element.style.display === "none";
    if (isHidden) return;

    const tagName = element.tagName || element.getAttribute("tagName");

    const thisSelector =
      (tagName ? tagName : "") +
      (element.getAttribute("id") ? "#" + element.getAttribute("id") : "") +
      (element.getAttribute("class")
        ? "." + element.getAttribute("class").trim().split(" ").join(".")
        : "");

    let selector =
      Array.from(getParents(element))
        .map(
          (x) =>
            x.tagName +
            (x.id ? "#" + x.id : "") +
            (x.className.trim()
              ? "." + x.className.trim().split(" ").join(".")
              : "") +
            (x.type ? `[type="${x.type}"]` : "")
        )
        .reverse()
        .join(">") +
      ">" +
      thisSelector;

    if (!selector) {
      log("Couldn't find selector for element:", element);
      return;
    }

    const index = getActiveOneOnly(selector, element);
    const value = element[dotValueForType(element.type)];
    const action = { selector, value };
    if (index !== undefined) action.index = index;

    data.recordIndex++;
    const actionCode = convertActionToCode(action, data.recordIndex);
    const actionSummary = `${thisSelector} = ${
      value === value.trim() && value !== "" ? value : `"${value}"`
    }\n`;
    data.record += data.record ? "\n" + actionCode : actionCode;
    data.summary += actionSummary;
    setData(data);
    log(actionSummary);
  }

  function getParents(el, parentSelectorStopAt) {
    if (parentSelectorStopAt === undefined) {
      parentSelectorStopAt = document.body;
    }

    const parents = [];
    let p = el.parentNode;

    while (p !== parentSelectorStopAt) {
      const o = p;
      parents.push(o);
      p = o.parentNode;
    }

    if (parentSelectorStopAt) parents.push(parentSelectorStopAt);
    return parents;
  }

  function getActiveOneOnly(selector, element) {
    const index = 0;

    const results = document.querySelectorAll(selector);
    const isUnique = results && results.length < 2;
    if (isUnique) return index;

    Array.from(results).filter((x, i) => {
      const isActiveElement = x === element;
      if (isActiveElement) {
        index = i;
      }
      return isActiveElement;
    });

    return index;
  }

  function convertActionToCode(action, recordIndex) {
    let type = action.selector?.match(/\[type="(.+)"\]/) || "";
    if (type) type = type[0];
    const setValue = dotValueForType(type) || "value";
    const selector = `${action.selector}${
      action.index ? "[" + (action.index + 1) + "]" : ""
    }`;
    return `await sleep();var e${recordIndex}=$('${selector}');
e${recordIndex}.click?.();e${recordIndex}.${setValue}=\`${action.value}\`;e${recordIndex}.change?.();`;
  }
}

function log() {
  console.log("FORM UTILITY BELT: \n", ...arguments);
}

function continueAutomation() {
  if (!data.continueAutomation || !hasAllowedHostname()) return;
  alert("TODO: handle continuing automation");
  // TODO: handle continuing automation
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  try {
    if (request.message === "combos") {
      combos();
    } else {
      stopAutomation();
    }
  } catch (error) {
    log(error);
    stopAutomation();
  }
});

function stopAutomation() {
  data.continueAutomation = false;
  setData(data);
}

function combos() {
  let currentlyVisibleInputs = getAllVisibleInputs();
  let currentlyAllowedValues = currentlyVisibleInputs.map((element) => {
    const forSureAllowed = getAllAllowedValues(element);
    const fallbackValues =
      !forSureAllowed || !forSureAllowed.length
        ? [getFallbackValue(element)]
        : [];
    return [...forSureAllowed, ...fallbackValues];
  });
  log(currentlyAllowedValues);
  stopAutomation();
}

function getAllVisibleInputs() {
  const possibleFormInputs = "input, select, textarea, button";
  return [...$$(possibleFormInputs)].filter((element) => {
    const computedStyles = getComputedStyle(element);
    return (
      computedStyles.visibility !== "hidden" &&
      computedStyles.display !== "none"
    );
  });
}

function getAllAllowedValues(formInputElement) {
  let allowedValues = [];
  // TODO: input could pull suggestions from a datalist
  if (formInputElement.tagName === "SELECT") {
    allowedValues = [...$("select").querySelectorAll("option")].map(
      (x) => x.value
    );
  }
  return allowedValues;
}

function dotValueForType(type) {
  switch (type) {
    case "checkbox":
    case "radio":
      return "checked";
    case "date":
      return "valueAsDate";
    default:
      return "value";
  }
}

function getFallbackValue(formInputElement) {
  if (
    formInputElement.tagName !== "INPUT" &&
    formInputElement.tagName !== "TEXTAREA"
  ) {
    return "test";
  }
  const now = new Date();
  const year = now.getFullYear();
  switch (formInputElement.type) {
    case "checkbox":
      return true;
    case "color":
      return "#ff0000";
    case "date":
      return now;
    case "datetime-local":
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      return now.toISOString().slice(0, 16);
    case "email":
      return "test@test.com";
    case "file":
      return "C:\\fakepath\\test.txt";
    case "month":
      const month = String(now.getMonth()).padStart(2, "0");
      return `${year}-${month}`;
    case "number":
      return 1;
    case "password":
      return "password";
    case "radio":
      return true;
    case "range":
      return 1;
    case "search":
      return "test";
    case "tel":
      return "2345678901";
    case "text":
      return "test";
    case "time":
      return now.toISOString().substring(11, 16);
    case "url":
      return "https://example.com";
    case "week":
      const days = Math.floor((now - year) / (24 * 60 * 60 * 1000));
      const week = Math.ceil((now.getDay() + 1 + days) / 7);
      return `${year}-W${week}`;
    default:
      return "test";
  }
}
