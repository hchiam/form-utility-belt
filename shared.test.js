import {
  getHostnameFromUrl,
  isAllowedHostname,
  getComboNumberFromValues,
} from "./shared.js";

let fails = 0;

test(getHostnameFromUrl("surge.sh"), "surge.sh");
test(getHostnameFromUrl("some.test.site"), "some.test.site");
test(getHostnameFromUrl("surge.sh") === "asdf", false);
test(getHostnameFromUrl("some.test.site/some/path"), "some.test.site");
test(getHostnameFromUrl("http://some.test.site"), "some.test.site");
test(getHostnameFromUrl("https://some.test.site"), "some.test.site");

test(isAllowedHostname(["surge.sh"], ["surge.sh"]), true);
test(
  isAllowedHostname(
    [getHostnameFromUrl("https://hchiam-example-prompts.surge.sh/")],
    ["surge.sh"]
  ),
  true
);
test(isAllowedHostname(["surge.sh"], []), false);
test(isAllowedHostname(["surge.sh"], ["test", "a", "b"]), false);
test(isAllowedHostname(["surge.sh"], ["test", "a", "b", "surge.sh"]), true);
test(isAllowedHostname(["surge.sh"], ["*"]), true);
test(isAllowedHostname(["surge.sh"], ["test", "a", "b", "*"]), true);

(function () {
  const ab = ["a", "b"];
  const numbers = [1, 2, 3];
  test(getComboNumberFromValues(["a", 1], [[...ab], [...numbers]]), 0);
  test(getComboNumberFromValues(["a", 2], [[...ab], [...numbers]]), 1);
  test(getComboNumberFromValues(["a", 3], [[...ab], [...numbers]]), 2);
  test(getComboNumberFromValues(["b", 1], [[...ab], [...numbers]]), 3);
  test(getComboNumberFromValues(["b", 2], [[...ab], [...numbers]]), 4);
  test(getComboNumberFromValues(["b", 3], [[...ab], [...numbers]]), 5);
  const p = ["", "password"];
  const i = ["", "test"];
  test(getComboNumberFromValues(["", ""], [[...p], [...i]]), 0);
  test(getComboNumberFromValues(["", "test"], [[...p], [...i]]), 1);
  test(getComboNumberFromValues(["password", ""], [[...p], [...i]]), 2);
  test(getComboNumberFromValues(["password", "test"], [[...p], [...i]]), 3);
})();

if (fails > 0) {
  console.log(`FAILED: ${fails} x ❌`);
} else {
  console.log("ALL PASSED! ✅");
}

function test(actual, expected) {
  const passed = actual === expected;
  console.log(passed ? "✅ passed" : "❌ FAILED");
  if (!passed) {
    fails++;
    console.log("    Actual:", actual);
    console.log("    Expected:", expected);
    console.log();
  }
}

// // jest doesn't seem to work with imports right now
// describe("test", () => {
//   it("works", () => {
//     expect(getHostnameFromUrl("surge.sh")).toBe("surge.sh");
//   });
// });
