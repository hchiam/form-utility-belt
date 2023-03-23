// this runs on the current page

let data = {
  hostname: "*",
  submit_selector: "[type='submit']",
  record: "",
  summary: "",
};

const recordPrefix = `async function sleep(ms){await new Promise(r=>setTimeout(r,ms||100));};
$=document.querySelector.bind(document);`;

setEverythingUp();

function setEverythingUp() {
  getData(() => {
    if (hasSameHostname(data.hostname)) {
      reinitializeRecordUponFirstInteraction();
      record();
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

function hasSameHostname(hostname) {
  return hostname === "*" || location.hostname.endsWith(hostname);
}

function reinitializeRecordUponFirstInteraction() {
  Array.from(document.querySelectorAll("*")).forEach((element) =>
    element.addEventListener("change", reinitializeRecord)
  );
}

function reinitializeRecord() {
  data.record = recordPrefix;
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
              : "")
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
    const value = element.value;
    const action = { selector, value };
    if (index !== undefined) action.index = index;

    const actionCode = convertActionToCode(action);
    const actionSummary = `${thisSelector} = ${value}\n`;
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

  function convertActionToCode(action) {
    return `await sleep();$('${action.selector}')${
      action.index ? ".get(" + (action.index + 1) + ")" : ""
    }.click?.();$('${action.selector}').value='${action.value}';$('${
      action.selector
    }').change?.();`;
  }
}

function log() {
  console.log("FORM UTILITY BELT: \n", ...arguments);
}
