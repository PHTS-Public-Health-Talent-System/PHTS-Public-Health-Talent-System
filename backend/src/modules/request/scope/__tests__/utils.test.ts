import { parseSpecialPositionScopes } from "../utils.js";

describe("parseSpecialPositionScopes", () => {
  it("splits scopes by semicolon and comma", () => {
    const input =
      "หัวหน้าตึก/หัวหน้างาน-งานไตเทียม,หัวหน้ากลุ่มงาน-กลุ่มงานเภสัชกรรม; หออภิบาลผู้ป่วยวิกฤต";
    expect(parseSpecialPositionScopes(input)).toEqual([
      "หัวหน้าตึก/หัวหน้างาน-งานไตเทียม",
      "หัวหน้ากลุ่มงาน-กลุ่มงานเภสัชกรรม",
      "หออภิบาลผู้ป่วยวิกฤต",
    ]);
  });
});
