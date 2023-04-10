const $ = document.querySelector.bind(document);
const select = $("select");
select?.addEventListener("change", () => {
  const parent_visibility_hidden = $("#parent_visibility_hidden");
  if (!parent_visibility_hidden) return;
  if (select.value === "show hidden") {
    parent_visibility_hidden.parentElement.style.visibility = "";
  } else {
    parent_visibility_hidden.parentElement.style.visibility = "hidden";
  }
});
