const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const select = $("select");
const submit = $('input[type="submit"]');

select?.addEventListener("change", () => {
  const parent_visibility_hidden = $("#parent_visibility_hidden");
  if (!parent_visibility_hidden) return;
  if (select.value === "show hidden") {
    parent_visibility_hidden.parentElement.style.visibility = "";
  } else {
    parent_visibility_hidden.parentElement.style.visibility = "hidden";
  }
});

submit?.addEventListener("click", (e) => {
  // TODO: check .isRequired for checkbox/radio
  const isRequired = [...$$('.isRequired:not([type="submit"])')];
  const visible = isRequired.filter((e) => isVisible(e));
  const filled = isRequired.filter(
    (e) => e.value || e.checked || e.valueAsDate
  );
  if (visible.length !== filled.length) {
    e.preventDefault();
    alert("not all visible required are filled");
  }
});

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
