// this runs on the current page

(async function () {
  const sharedJs = chrome.runtime.getURL("shared.js");
  const shared = await import(sharedJs);

  const defaultHostnames = shared.defaultHostnames;
  const defaultSubmitSelector = shared.defaultSubmitSelector;

  let data = { ...shared.defaultData };

  const recordPrefix = `const $$=document.querySelectorAll.bind(document);
async function sleep(ms){await new Promise(r=>setTimeout(r,ms||100));};`;
  const iifeStart = `;(async function(){\n`;
  const iifeStartRegex = `;\\(async function\\(\\)\\{\\n`;
  const iifeEnd = `\n})();`;
  const iifeEndRegex = `\\n\\}\\)\\(\\);`;
  const $ = document.querySelector.bind(document);
  const $$ = document.querySelectorAll.bind(document);
  async function sleep(ms) {
    await new Promise((r) => setTimeout(r, ms || 100));
  }

  setEverythingUp();

  function setEverythingUp() {
    shared.getData((updatedData) => {
      data = updatedData;
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

  function hasAllowedHostname() {
    return shared.isAllowedHostname(
      [shared.getHostnameFromUrl(location.hostname)],
      data.hostnames
    );
  }

  function reinitializeRecordUponFirstInteraction() {
    Array.from($$("*")).forEach((element) =>
      element.addEventListener("change", reinitializeRecord)
    );
  }

  function reinitializeRecord() {
    data.record = iifeStart + recordPrefix + iifeEnd;
    data.recordIndex = 0;
    data.summary = "";
    shared.setData(data);
    log("\n\nNew recording started.\n\n\n");
    Array.from($$("*")).forEach((element) =>
      element.removeEventListener("change", reinitializeRecord)
    );
  }

  function record() {
    Array.from($$("*")).forEach((element) =>
      element.addEventListener("change", handleChangesInAnyElement)
    );

    function handleChangesInAnyElement(event) {
      const isUserGenerated = event.isTrusted;
      if (!isUserGenerated) return;

      const wasTriggeredOnThisElement = event.target === this;
      if (!wasTriggeredOnThisElement) return;

      const element = this;

      const isHidden =
        element.style.visibility === "hidden" ||
        element.style.display === "none";
      if (isHidden) return;

      const thisSelector = getThisSelector(element);

      const selector = getSelector(element);

      if (!selector) {
        log("Couldn't find selector for element:", element);
        return;
      }

      const index = getActiveOneOnly(selector, element);
      const value = element[dotValueForType(element.type)];
      const action = { selector, value };
      if (index !== undefined) action.index = index;

      data.recordIndex++;
      const actionCode = convertActionToCode(action, element, data.recordIndex);
      const nth = $$(selector).length > 1 ? `[${index}]` : "";
      const actionSummary = `${thisSelector}${nth} = ${
        String(value) === String(value).trim() && value !== ""
          ? value
          : `"${value}"`
      }\n`;

      data.record = data.record
        .replace(new RegExp("^" + iifeStartRegex), "")
        .replace(new RegExp(iifeEndRegex + "$"), "");
      data.record += data.record ? "\n" + actionCode : actionCode;
      data.record = iifeStart + data.record + iifeEnd;
      data.summary += actionSummary;
      shared.setData(data);
      if (!data.continueAutomation) log(actionSummary);
    }

    function getActiveOneOnly(selector, element) {
      let index = 0;

      const results = $$(selector);
      const isUnique = results && results.length < 2;
      if (isUnique) return 0;

      Array.from(results).filter((x, i) => {
        const isActiveElement = x === element;
        if (isActiveElement) {
          index = i;
        }
        return isActiveElement;
      });

      return index;
    }

    function convertActionToCode(action, element, recordIndex) {
      let type = action.selector?.match(/\[type="(.+)"\]/) || "";
      if (type) {
        type = type[0];
      } else {
        type = element.type;
      }
      const setValue = dotValueForType(type) || "value";
      const selector = action.selector;
      const nth = action.index ? `[${action.index}]` : "[0]";
      const value =
        typeof action.value === "string"
          ? action.value.replace(/`/g, "\\`")
          : action.value;
      return `await sleep();
var e${recordIndex}=$$('${selector}')${nth};
e${recordIndex}?.click?.();if(e${recordIndex} && "${setValue}" in e${recordIndex})e${recordIndex}.${setValue}=\`${value}\`;e${recordIndex}?.dispatchEvent?.(new Event('change'));`;
    }
  }

  function getThisSelector(element) {
    const tagName = element.tagName || element.getAttribute("tagName");

    const thisSelector =
      (tagName ? tagName : "") +
      (element.getAttribute("id") ? "#" + element.getAttribute("id") : "") +
      (element.getAttribute("class").trim()
        ? "." + element.getAttribute("class").trim().split(" ").join(".")
        : "") +
      (element.tagName === "INPUT" && element.type
        ? `[type="${element.type}"]`
        : "");

    return thisSelector;
  }

  function getSelector(element) {
    const thisSelector = getThisSelector(element);

    const selector =
      Array.from(getParents(element))
        .map(
          (x) =>
            x.tagName +
            (x.id ? "#" + x.id : "") +
            (x.className.trim()
              ? "." +
                x.className.trim().replace(/  +/g, " ").split(" ").join(".")
              : "") +
            (x.tagName === "INPUT" && x.type ? `[type="${x.type}"]` : "")
        )
        .reverse()
        .join(">") +
      ">" +
      thisSelector;

    return selector;
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

  function log() {
    console.log("FORM UTILITY BELT: \n", ...arguments);
  }

  async function continueAutomation() {
    if (!data.continueAutomation || !hasAllowedHostname()) return;

    if (!$(data.submit_selector)) {
      data.continueAutomation = data.submitRetriesLeft > 0;
      data.submitRetriesLeft = Math.max(0, data.submitRetriesLeft - 1);
      shared.setData(data, async function () {
        if (data.continueAutomation) {
          const message = `COMBOS: Could not find "${data.submit_selector}". Going back one page in 3 seconds.`;
          log(message);
          await sleep(3000);
          window.history.back();
        } else {
          stopAutomation();
        }
      });
    } else if (data.comboAt < 0 || data.comboAt >= data.comboCount) {
      stopAutomation();
    } else {
      log("COMBOS: Continuing automation in 3 seconds.");
      await sleep(3000);

      const allInputs = getAllInputs();
      const allAllowedValues = getAllAllowedValuesOfAllInputs(allInputs);

      const remainingAllowedValues =
        shared.getRemainingAllowedValuesFromComboNumber(
          data.comboAt,
          allAllowedValues
        );
      combos(remainingAllowedValues);
    }
  }

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.message === "stop-combos") {
      stopAutomation();
      return;
    }

    shared.getData((updatedData) => {
      data = updatedData;
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
  });

  function stopAutomation() {
    data.continueAutomation = false;
    shared.setData(data);
    log("Trying to PAUSE combos automation.", new Date());
    resetTabIcon();
    shared.beep();
    chrome.runtime
      .sendMessage({
        action: "stop-combos_content",
      })
      .catch((e) => {
        log(e);
      });
  }

  async function combos(currentlyAllowedValues = null) {
    if (!data.continueAutomation) {
      resetTabIcon();
      stopAutomation();
      return;
    }

    changeTabIcon();

    log("STARTING combos automation.", new Date());

    const allInputs = getAllInputs();
    const allAllowedValues =
      currentlyAllowedValues || getAllAllowedValuesOfAllInputs(allInputs);
    data.submitRetriesLeft = 1; // re-init
    data.comboCount = allAllowedValues
      .map((x) => x.length) // otherwise .reduce returns NaN because initialValue=1 wouldn't have .length
      .reduce((a, b) => (b ? a * b : a));
    if (!currentlyAllowedValues) {
      data.comboAt = 0; // just starting (as opposed to continuing where left off)
      await shared.setData(data);
    }

    shared.setData(data, async function () {
      let timer = setInterval(() => {
        shared.getData((updatedData) => {
          data = updatedData;
          if (!data.continueAutomation) {
            clearInterval(timer);
            stopAutomation();
          }
        });
      }, 1000);
      log("COMBOS: list of allInputs", allInputs);
      if (data.comboAt === 0) {
        await tryAllLastValuesFirst(allInputs, allAllowedValues);
        resetAllInputs();
      }
      await recursivelyTryCombos(allInputs, allAllowedValues);
      log("COMBOS: list of allInputs", allInputs);
      stopAutomation();
    });
  }

  async function tryAllLastValuesFirst(allInputs, allAllowedValues) {
    data.comboAt = -1; // so that log and allowed values will use -1
    await shared.setData(data);

    allInputs.forEach(async function (input, index) {
      const isInputCurrentlyVisible = isVisible(input);
      if (isInputCurrentlyVisible) {
        let allowedVals = [...allAllowedValues[index]];
        allowedVals = getUniqueValuesForRepeatSubmit(input, allowedVals);
        const lastAllowedValue = allowedVals.slice(-1)[0];

        const safeToClickOrChange =
          !input.type || (input.type !== "file" && input.type !== "color");

        if (safeToClickOrChange) input?.click?.();
        input[dotValueForType(input.type)] = lastAllowedValue;
        if (safeToClickOrChange) input.dispatchEvent?.(new Event("change"));

        await sleep();
      }
    });

    await trySubmit(allInputs);
  }

  async function recursivelyTryCombos(
    allInputs,
    allAllowedValues,
    indexOfCurrentInput = 0,
    comboValuesIndices
  ) {
    if (!data.continueAutomation) return;

    if (!comboValuesIndices) {
      comboValuesIndices = new Array(allInputs.length).fill(0);
    }

    // for each value of the current input:
    for (let v = 0; v < allAllowedValues[indexOfCurrentInput].length; v++) {
      comboValuesIndices[indexOfCurrentInput] = v;

      const canRecurse = indexOfCurrentInput + 1 < allInputs.length;

      if (canRecurse) {
        // try all the values of the next input:
        await recursivelyTryCombos(
          allInputs,
          allAllowedValues,
          indexOfCurrentInput + 1,
          comboValuesIndices
        );
      } else if (/* ready for submit input && */ data.continueAutomation) {
        data.comboAt++;
        await shared.setData(data);

        // now set the current combo's values of all visible inputs:
        for (let i = 0; i < allInputs.length; i++) {
          const input = allInputs[i];

          const isInputCurrentlyVisible = isVisible(input);
          if (!isInputCurrentlyVisible) continue;

          const indexOfValueToUseForInput = comboValuesIndices[i];

          const value = getUniqueValuesForRepeatSubmit(
            input,
            allAllowedValues[i]
          )[indexOfValueToUseForInput];

          const safeToClickOrChange =
            !input.type || (input.type !== "file" && input.type !== "color");

          if (safeToClickOrChange) input?.click?.();
          input[dotValueForType(input.type)] = value;
          if (safeToClickOrChange) input.dispatchEvent?.(new Event("change"));

          await sleep(10);
        }

        await trySubmit(allInputs);
      }
    }
  }

  function trySubmit(allInputs) {
    if (!isVisible($(data.submit_selector))) {
      log(
        `COMBO ${data.comboAt}/${data.comboCount}: ❌ Submit input isn't visible: ${data.submit_selector}`,
        allInputs.map((element) => element[dotValueForType(element.type)])
      );
      // resetAllInputs();
    } else if ($(data.submit_selector).disabled) {
      log(
        `COMBO ${data.comboAt}/${data.comboCount}: ❌ Submit input is disabled: ${data.submit_selector}`,
        allInputs.map((element) => element[dotValueForType(element.type)])
      );
      // resetAllInputs();
    } else {
      log(
        `COMBO ${data.comboAt}/${data.comboCount}: ✅ Can hit submit: ${data.submit_selector}`,
        allInputs.map((element) => element[dotValueForType(element.type)])
      );
      if (data.submit_combos) {
        $(data.submit_selector).click();
      }
      // resetAllInputs();
    }
  }

  function getAllInputs() {
    const possibleFormInputs = `input:not([type="submit"]):not([type="hidden"]), select, textarea`; // not button?
    const submitInputElements = $$(
      data.submit_selector || defaultSubmitSelector
    );
    return [...$$(possibleFormInputs)].filter((element) => {
      const isNotSubmitInput = [...submitInputElements].every(
        (submitElement) => submitElement !== element
      );
      return /*isVisible(element) &&*/ isNotSubmitInput;
    });
    /* don't .reverse() so that complex visibility logic works better, assuming earlier items hide/show later items */
    // .reverse(); // so first input changes most, for visual reassurance;
  }

  function isVisible(element) {
    if (!element) return false;
    const computedStyles = getComputedStyle(element);
    return (
      computedStyles.visibility !== "hidden" &&
      computedStyles.display !== "none" &&
      !isAnyAncestorDisplayNone(element)
    );
  }

  function isAnyAncestorDisplayNone(element) {
    const hasParent = element?.parentElement;
    if (!hasParent) return false;

    const computedStyles = getComputedStyle(element.parentElement);
    return (
      computedStyles.display === "none" ||
      isAnyAncestorDisplayNone(element.parentElement)
    );
  }

  /** param allInputs must be an array of HTML elements */
  function getAllAllowedValuesOfAllInputs(allInputs) {
    const allAllowedValues = [];
    allInputs.forEach((element) => {
      const forSureAllowed = getAllAllowedValues(element);
      const fallbackValues =
        !forSureAllowed || !forSureAllowed.length
          ? getFallbackValues(element)
          : [];
      allAllowedValues.push([...forSureAllowed, ...fallbackValues]);
    });
    return allAllowedValues;
  }

  function getAllAllowedValues(formInputElement) {
    let allowedValues = [];
    if (formInputElement.tagName === "SELECT") {
      // Note: you apparently can't use styles to hide options in Safari/iOS
      allowedValues = [...formInputElement.querySelectorAll("option")].map(
        (x) => x.value
      );
      const uniqueValues = [...new Set(allowedValues)];
      allowedValues = uniqueValues;
    } else if (formInputElement.tagName === "INPUT") {
      const datalistValues = getDatalist(formInputElement);
      allowedValues.push(...datalistValues);
    }
    return allowedValues;
  }

  function getDatalist(formInputElement) {
    if (formInputElement.tagName !== "INPUT") return [];

    const datalistId = formInputElement.getAttribute("list");
    const datalistElement = $(`#${datalistId}`);

    if (!datalistElement) return [];

    return [""].concat(
      [...datalistElement.querySelectorAll("option")].map((o) =>
        o.getAttribute("value")
      )
    );
  }

  function dotValueForType(type) {
    switch (type) {
      case "checkbox":
      case "radio":
        return "checked";
      case "date":
        return "valueAsDate";
      case "submit":
        return "";
      default:
        return "value";
    }
  }

  function getFallbackValues(formInputElement) {
    if (formInputElement.tagName === "TEXTAREA") {
      return ["", "test"];
    } else if (formInputElement.tagName !== "INPUT") {
      return ["", "test"];
    }
    const now = new Date();
    const year = now.getFullYear();
    switch (formInputElement.type) {
      case "checkbox":
        return [false, true];
      case "color":
        return ["#ff0000"]; // '' isn't allowed for color
      case "date":
        return [now]; // '' isn't allowed for date
      case "datetime-local":
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return ["", now.toISOString().slice(0, 16)];
      case "email":
        return ["", "test@test.com"];
      case "file":
        return ["" /*, "C:\\fakepath\\test.txt"*/]; // not allowed to programmatically set non-empty file path
      case "month":
        const month = String(now.getMonth()).padStart(2, "0");
        return ["", `${year}-${month}`];
      case "number":
        return ["", 1];
      case "password":
        return ["", "password"];
      case "radio":
        return [false, true];
      case "range":
        return [1];
      case "search":
        return ["", "test"];
      case "submit":
        return [""];
      case "tel":
        return ["", "2345678901"];
      case "text":
        return ["", "test"];
      case "time":
        return ["", now.toISOString().substring(11, 16)];
      case "url":
        return ["", "https://example.com"];
      case "week":
        const yearStartDate = new Date(year, 0, 1);
        const days = Math.floor((now - yearStartDate) / (24 * 60 * 60 * 1000));
        const week = Math.ceil(days / 7);
        return ["", `${year}-W${week}`];
      default:
        return ["", "test"];
    }
  }

  /** must return an array */
  function getUniqueValuesForRepeatSubmit(inputElement, defaultValues) {
    const valuesArray = [...defaultValues];
    if (inputElement.tagName === "TEXTAREA") {
      return ["", `test${data.comboAt}`];
    } else if (inputElement.tagName !== "INPUT") {
      return valuesArray;
    }
    switch (inputElement.type) {
      case "checkbox":
      case "color":
      case "date":
      case "datetime-local":
        return valuesArray;
      case "email":
        return ["", `test${data.comboAt}@test.com`];
      case "file":
      case "month":
      case "number":
      case "password":
      case "radio":
      case "range":
      case "search":
      case "submit":
      case "tel":
        return valuesArray;
      case "text":
        return ["", `test${data.comboAt}`];
      case "time":
      case "url":
      case "week":
        return valuesArray;
      default:
        return valuesArray;
    }
  }

  /** allInputs=[HTML elements] and allAllowedValues=[] */
  function getComboNumber(allInputs, allAllowedValues) {
    const currentValues = allInputs.map((x) => x[dotValueForType(x.type)]);
    let allowedVals = allInputs.map((input, i) =>
      getUniqueValuesForRepeatSubmit(input, allAllowedValues[i])
    );
    // log("currentValues", currentValues, "allowedVals", allowedVals);
    return shared.getComboNumberFromValues(currentValues, allowedVals);
  }

  function resetAllInputs() {
    // TODO: fix timing issue when called in recursivelyTryCombos > recurse > trySubmit > resetAllInputs
    const possibleFormInputs = `input:not([type="submit"]):not([type="hidden"]), select, textarea`; // not button?
    $$(possibleFormInputs).forEach((input) => {
      const safeToClickOrChange =
        !input.type || (input.type !== "file" && input.type !== "color");
      if (safeToClickOrChange) input?.click?.();
      if (input.type !== "color") input[dotValueForType(input.type)] = null;
      if (safeToClickOrChange) input.dispatchEvent?.(new Event("change"));
    });
  }

  const tabIcon = $('[rel="icon"]')?.href;
  const customIcon =
    "https://github.com/hchiam/form-utility-belt/blob/main/icon_128.png?raw=true";
  function changeTabIcon() {
    if ($('[rel="icon"]')?.href) {
      $('[rel="icon"]').href = customIcon;
      // chrome.runtime.sendMessage({
      //   action: "change-icon",
      //   value: tabIcon,
      // });
    }
  }

  function resetTabIcon() {
    if ($('[rel="icon"]')?.href) {
      $('[rel="icon"]').href = tabIcon;
      // chrome.runtime.sendMessage({
      //   action: "change-icon",
      //   value: customIcon, // TODO: this doesn't work for some reason
      // });
    }
  }
})();
