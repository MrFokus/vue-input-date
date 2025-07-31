#!/usr/bin/env node

import path from 'path'
import fs from 'fs-extra'
import { fileURLToPath } from 'url'
import inquirer from 'inquirer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const baseDir = path.resolve(__dirname, '../') // корень пакета

async function copyFile(from, to) {
  const src = path.join(baseDir, from)
  const dest = path.resolve(to)

  if (fs.existsSync(src)) {
    await fs.copy(src, dest)
    console.log(`✅ Скопировано: ${from} → ${to}`)
  } else {
    console.warn(`⚠️ Файл "${from}" не найден, пропущено`)
  }
}

async function installDatePicker() {
  const { componentPath } = await inquirer.prompt([
    {
      name: 'componentPath',
      type: 'input',
      message: 'Куда установить компонент InputDate.vue?',
      default: './components'
    }
  ])

  await copyFile('components/InputDate.vue', path.join(componentPath, 'InputDate.vue'))
  return componentPath
}

async function main() {
  await installDatePicker()
}

main()
