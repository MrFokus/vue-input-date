#!/usr/bin/env node

// cli/init.ts
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import inquirer from "inquirer";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var baseDir = path.resolve(__dirname, "../");
async function copyFile(from, to) {
  const src = path.join(baseDir, from);
  const dest = path.resolve(to);
  if (fs.existsSync(src)) {
    await fs.copy(src, dest);
    console.log(`\u2705 \u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E: ${from} \u2192 ${to}`);
  } else {
    console.warn(`\u26A0\uFE0F \u0424\u0430\u0439\u043B "${from}" \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D, \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E`);
  }
}
async function installDatePicker() {
  const { componentPath } = await inquirer.prompt([
    {
      name: "componentPath",
      type: "input",
      message: "\u041A\u0443\u0434\u0430 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 InputDate.vue?",
      default: "./components"
    }
  ]);
  await copyFile("components/InputDate.vue", path.join(componentPath, "InputDate.vue"));
  return componentPath;
}
async function main() {
  await installDatePicker();
}
main();
