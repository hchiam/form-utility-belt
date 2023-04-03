import {
  getHostnameFromUrl,
  isAllowedHostname,
  getComboNumberFromValues,
  getValuesFromComboNumber,
  getRemainingAllowedValuesFromComboNumber,
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
  const p = ["", "p"];
  const i = ["", "t"];
  test(getComboNumberFromValues(["", ""], [[...p], [...i]]), 0);
  test(getComboNumberFromValues(["", "t"], [[...p], [...i]]), 1);
  test(getComboNumberFromValues(["p", ""], [[...p], [...i]]), 2);
  test(getComboNumberFromValues(["p", "t"], [[...p], [...i]]), 3);

  test(
    getValuesFromComboNumber(0, [[...p], [...i]]).join(","),
    ["", ""].join(",")
  );
  test(
    getValuesFromComboNumber(1, [[...p], [...i]]).join(","),
    ["", "t"].join(",")
  );
  test(
    getValuesFromComboNumber(2, [[...p], [...i]]).join(","),
    ["p", ""].join(",")
  );
  test(
    getValuesFromComboNumber(3, [[...p], [...i]]).join(","),
    ["p", "t"].join(",")
  );

  test(getRemainingAllowedValuesFromComboNumber(0, [[...p], [...i]]), [
    ["", "p"],
    ["", "t"],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(1, [[...p], [...i]]), [
    ["", "p"],
    ["", "t"],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(2, [[...p], [...i]]), [
    ["p"],
    ["", "t"],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(3, [[...p], [...i]]), [
    ["p"],
    ["t"],
  ]);

  test(getRemainingAllowedValuesFromComboNumber(0, [[...p], [...numbers]]), [
    ["", "p"],
    [1, 2, 3],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(1, [[...p], [...numbers]]), [
    ["", "p"],
    [1, 2, 3],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(2, [[...p], [...numbers]]), [
    ["", "p"],
    [1, 2, 3],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(3, [[...p], [...numbers]]), [
    ["p"],
    [1, 2, 3],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(4, [[...p], [...numbers]]), [
    ["p"],
    [2, 3],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(5, [[...p], [...numbers]]), [
    ["p"],
    [3],
  ]);

  test(getRemainingAllowedValuesFromComboNumber(0, [[...p], [...i], [...ab]]), [
    ["", "p"],
    ["", "t"],
    ["a", "b"],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(1, [[...p], [...i], [...ab]]), [
    ["", "p"],
    ["", "t"],
    ["a", "b"],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(2, [[...p], [...i], [...ab]]), [
    ["", "p"],
    ["", "t"],
    ["a", "b"],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(3, [[...p], [...i], [...ab]]), [
    ["", "p"],
    ["", "t"],
    ["a", "b"],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(4, [[...p], [...i], [...ab]]), [
    ["p"],
    ["", "t"],
    ["a", "b"],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(5, [[...p], [...i], [...ab]]), [
    ["p"],
    ["", "t"],
    ["a", "b"],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(6, [[...p], [...i], [...ab]]), [
    ["p"],
    ["t"],
    ["a", "b"],
  ]);
  test(getRemainingAllowedValuesFromComboNumber(7, [[...p], [...i], [...ab]]), [
    ["p"],
    ["t"],
    ["b"],
  ]);
})();

if (fails > 0) {
  console.log(`FAILED: ${fails} x ❌`);
} else {
  console.log("ALL PASSED! ✅");
}

function test(actual, expected) {
  let passed = true;
  if (Array.isArray(actual) || Array.isArray(expected)) {
    passed &&= handleArray(actual, expected);
  } else {
    passed &&= actual === expected;
  }
  console.log(passed ? "✅ passed" : "❌ FAILED");
  if (!passed) {
    fails++;
    console.log("    Actual:", actual);
    console.log("    Expected:", expected);
    console.log();
  }
}

function handleArray(actual, expected) {
  if (Array.isArray(actual) !== Array.isArray(expected)) return false;
  if (actual.length !== expected.length) return false;
  for (let i = 0; i < actual.length; i++) {
    if (Array.isArray(actual[i]) || Array.isArray(expected[i])) {
      if (!handleArray(actual[i], expected[i])) return false;
    } else if (actual[i] !== expected[i]) {
      return false;
    }
  }
  return true;
}

// // jest doesn't seem to work with imports right now
// describe("test", () => {
//   it("works", () => {
//     expect(getHostnameFromUrl("surge.sh")).toBe("surge.sh");
//   });
// });
