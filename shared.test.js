import {
  getHostnameFromUrl,
  isAllowedHostname,
  getComboNumberFromValues,
  getValuesFromComboNumber,
  getRemainingAllowedValuesFromComboNumber,
  isZipCode,
  isPostalCode,
  isPOBox,
  isTelephoneNumber,
  isYear,
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

  test(
    getRemainingAllowedValuesFromComboNumber(0, [[...numbers], [...numbers]]),
    [
      [1, 2, 3],
      [1, 2, 3],
    ]
  );
  test(
    getRemainingAllowedValuesFromComboNumber(1, [[...numbers], [...numbers]]),
    [
      [1, 2, 3],
      [1, 2, 3],
    ]
  );
  test(
    getRemainingAllowedValuesFromComboNumber(2, [[...numbers], [...numbers]]),
    [
      [1, 2, 3],
      [1, 2, 3],
    ]
  );
  test(
    getRemainingAllowedValuesFromComboNumber(3, [[...numbers], [...numbers]]),
    [
      [2, 3],
      [1, 2, 3],
    ]
  );
  test(
    getRemainingAllowedValuesFromComboNumber(4, [[...numbers], [...numbers]]),
    [
      [2, 3],
      [1, 2, 3],
    ]
  );
  test(
    getRemainingAllowedValuesFromComboNumber(5, [[...numbers], [...numbers]]),
    [
      [2, 3],
      [1, 2, 3],
    ]
  );
  test(
    getRemainingAllowedValuesFromComboNumber(6, [[...numbers], [...numbers]]),
    [[3], [1, 2, 3]]
  );
  test(
    getRemainingAllowedValuesFromComboNumber(7, [[...numbers], [...numbers]]),
    [[3], [2, 3]]
  );
  test(
    getRemainingAllowedValuesFromComboNumber(8, [[...numbers], [...numbers]]),
    [[3], [3]]
  );

  test(isZipCode("zip Code :  "), true);
  test(isZipCode("Zip Code:"), true);
  test(isZipCode("ZIP"), true);
  test(isZipCode("Your ZIP: "), true);
  test(isZipCode("Please enter your ZIP Code:  "), true);
  test(isZipCode("Please type your ZIP Code:  "), true);
  test(isZipCode("Please provide us your ZIP Code:  "), true);
  test(isZipCode("Please give your ZIP Code:  "), true);
  test(isZipCode("Zipper color:"), false);
  test(isPostalCode("Postal Code :  "), true);
  test(isPostalCode("Postal"), true);
  test(isPostalCode("Your postal code: "), true);
  test(isPostalCode("Please enter your Postal Code:  "), true);
  test(isPostalCode("Please type your Postal Code:  "), true);
  test(isPostalCode("Please provide us your Postal Code:  "), true);
  test(isPostalCode("Please give your Postal Code:  "), true);
  test(isPOBox("PO Box :  "), true);
  test(isPOBox("P.O. Box:"), true);
  test(isPOBox("PO"), true);
  test(isPOBox("P.O."), true);
  test(isPOBox("Your PO Box: "), true);
  test(isPOBox("PO Boxington:"), false);
  test(isPOBox("Please enter your P.O. Box:  "), true);
  test(isPOBox("Please type your P.O. Box:  "), true);
  test(isPOBox("Please provide us your P.O. Box:  "), true);
  test(isPOBox("Please give your P.O. Box:  "), true);
  test(isTelephoneNumber("tel number :  "), true);
  test(isTelephoneNumber("telephone:"), true);
  test(isTelephoneNumber("phone:"), true);
  test(isTelephoneNumber("cell:"), true);
  test(isTelephoneNumber("cellphone:"), true);
  test(isTelephoneNumber("cell phone:"), true);
  test(isTelephoneNumber("tel:"), true);
  test(isTelephoneNumber("your number:"), true);
  test(isTelephoneNumber("Your telephone number: "), true);
  test(isTelephoneNumber("Tell us about yourself: "), false);
  test(isTelephoneNumber("Hotel name:"), false);
  test(isTelephoneNumber("Please enter your telephone number:  "), true);
  test(isTelephoneNumber("Please type your telephone number:  "), true);
  test(isTelephoneNumber("Please provide us your telephone number:  "), true);
  test(isTelephoneNumber("Please give your telephone number:  "), true);
  test(isYear("Please enter your date of birth:  "), true);
  test(isYear("Your birth date: "), true);
  test(isYear("Year : "), true);
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
