<template>
  <div
    ref="refInputDate"
    @focus="changeParentFocus"
    tabindex="0"
    class="mrfokus-input-date"
  >
    <template v-for="(field, index) in fields" :key="field">
      <input
        @paste="onPaste"
        autocomplete="off"
        class="field"
        type="text"
        :name="field"
        :placeholder="value[field]?.placeholder"
        :value="value[field]?.value"
        :style="`width: ${Number(value[field]?.length) + 1}ch`"
        @input="
          value[field]
            ? value[field].changeInput($event, field, value[field]?.length)
            : () => {}
        "
        @keydown.backspace="onBackspace($event, field)"
        @focus="selectField"
        @keydown.right="focusNext($event, field)"
        @keydown.left="focusPrev($event, field)"
        @click.stop="selectField"
      />
      <slot name="divider" v-if="index !== fields.length - 1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="12"
          viewBox="0 0 13 12"
          fill="none"
        >
          <path
            d="M4.00003 11L9.00003 1"
            stroke="#D0D5DD"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </slot>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";

type DateFormat = "dd.mm.yyyy";
const props = withDefaults(
  defineProps<{
    format?: DateFormat;
    modelValue: Date;
  }>(),
  {
    format: "dd.mm.yyyy",
  }
);

const emit = defineEmits<{
  "update:modelValue": [Date | null];
}>();

const defaultParams: Record<
  string,
  {
    placeholder: string;
    length: number;
    format: "number" | "string";
    changeInput: Function;
  }
> = {
  dd: {
    placeholder: "ДД",
    length: 2,
    format: "number",
    changeInput: onInputDay,
  },
  mm: {
    placeholder: "ММ",
    length: 2,
    format: "number",
    changeInput: onInputMonth,
  },
  yyyy: {
    placeholder: "ГГГГ",
    length: 4,
    format: "number",
    changeInput: onInputYear,
  },
};

const fields = computed(() => props.format.split("."));
const inputs = ref<HTMLInputElement[]>([]);
const refInputDate = ref<HTMLElement | null>(null);

const value = ref<
  Record<
    string,
    {
      value: string | null;
      length: number;
      placeholder: string;
      format: "number" | "string";
      changeInput: Function;
    }
  >
>({});

const setDateObject = () => {
  fields.value.forEach((field) => {
    const def = defaultParams[field];
    if (def) {
      value.value[field] = { value: null, ...def };
    }
  });
};
setDateObject();

onMounted(() => {
  inputs.value = Array.from(
    refInputDate.value?.querySelectorAll("input.field") ?? []
  );
});

watch(
  () => props.modelValue,
  () => {
    if (props.modelValue) fromDate(props.modelValue);
    else toEmpty();
  },
  { deep: true, immediate: true }
);

function onFocusOut(ev: InputEvent, name: string) {
  const target = ev.target as HTMLInputElement;
  if (+target.value == 0 && value.value[name]) {
    target.value = "1".padStart(value.value[name]?.length, "0");
  }
}
function onInputDay(ev: InputEvent, name: string, length: number) {
  const target = ev.target as HTMLInputElement;
  maskNumber(ev, name);
  if (+target.value > 31) {
    target.value = "31";
  }
  if (ev.inputType === "insertText") {
    if (target.value[0] === "0" && target.value.length > length) {
      target.value = target.value.slice(1, target.value.length);
      focusNext(ev, name);
    }
    if (+target.value < 10) {
      target.value = target.value.padStart(length, "0");
    } else if (+target.value > 10) {
      focusNext(ev, name);
    }
  }
  if (value.value[name]) value.value[name].value = target.value;
  onInputFix();
  emit("update:modelValue", toDate());
}
function onInputMonth(ev: InputEvent, name: string, length: number) {
  const target = ev.target as HTMLInputElement;
  maskNumber(ev, name);
  if (+target.value > 12) {
    target.value = "12";
  }
  if (ev.inputType === "insertText") {
    if (target.value[0] === "0" && target.value.length > length) {
      target.value = target.value.slice(1, target.value.length);
      focusNext(ev, name);
    }
    if (+target.value < 10) {
      target.value = target.value.padStart(length, "0");
    } else {
      focusNext(ev, name);
    }
  }
  if (value.value[name]) value.value[name].value = target.value;
  onInputFix();
  emit("update:modelValue", toDate());
}

function onInputYear(ev: InputEvent, name: string, length: number) {
  const target = ev.target as HTMLInputElement;
  maskNumber(ev, name);
  if (+target.value > 9999) {
    target.value = target.value.slice(0, -1);
  }
  if (ev.inputType === "insertText") {
    if (target.value[0] === "0" && target.value.length > length) {
      target.value = target.value.slice(1, target.value.length);
    }
    if (+target.value < 10) {
      target.value = target.value.padStart(length, "0");
    } else {
      focusNext(ev, name);
    }
  }
  if (value.value[name]) value.value[name].value = target.value;
  onInputFix();
  emit("update:modelValue", toDate());
}

function onInputFix() {
  if (!value.value.dd?.value && !value.value.mm?.value) return;
  const fixed: Record<string, string> = fixDate({
    dd: value.value.dd?.value ?? "",
    mm: value.value.mm?.value ?? "",
    yyyy: value.value.yyyy?.value ?? "",
  });

  for (const key of Object.keys(fixed)) {
    const input = inputs.value.find((i) => i.name === key);
    if (input && value.value[key]) {
      input.value = fixed[key]!;
      value.value[key].value = fixed[key]!;
    }
  }
}

function maskNumber(ev: Event, name: string) {
  const target = ev.target as HTMLInputElement;
  const val = target.value;

  const current = value.value[name];
  if (
    current?.format === "number" &&
    (isNaN(Number(val)) || val.toLowerCase().includes("e"))
  ) {
    target.value = current.value ?? "";
    return;
  }
}

function focusNext(ev: Event, name: string) {
  const index = inputs.value.findIndex((i) => i.name === name);
  const next = inputs.value[index + 1];

  // Автоматический переход к следующему полю
  if (next) {
    ev.preventDefault();
    next.focus();
    setTimeout(() => next.select(), 0);
  }
}
function focusPrev(ev: Event, name: string) {
  const index = inputs.value.findIndex((i) => i.name === name);
  const prev = inputs.value[index - 1];

  // Автоматический переход к следующему полю
  if (prev) {
    ev.preventDefault();
    prev.focus();
    prev.select();
    setTimeout(() => prev.select(), 0);
  }
}

function onPaste(ev: ClipboardEvent) {
  ev.preventDefault();
  const text =
    ev.clipboardData
      ?.getData("text")
      ?.trim()
      .replace(/[\s\-\/.]+/g, "") ?? "";
  let i = 0;
  for (const field of fields.value) {
    const len = value.value[field]?.length ?? 0;
    let chunk = text.slice(i, i + len);
    if (chunk.length !== len) {
      chunk = chunk.padStart(len, "0");
    }
    if (chunk.length === len) {
      const input = inputs.value.find((i) => i.name === field);
      if (input) {
        input.value = chunk;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      i += len;
    } else {
      break;
    }
  }
}

function onBackspace(ev: KeyboardEvent, name: string) {
  const target = ev.target as HTMLInputElement;
  target.value = "";
  if (
    target.selectionStart === 0 &&
    target.selectionEnd === 0 &&
    !target.value
  ) {
    const index = inputs.value.findIndex((i) => i.name === name);
    const prev = inputs.value[index - 1];
  }
  if (value.value[name]) value.value[name].value = target.value;
  emit("update:modelValue", toDate());
}

function changeParentFocus(ev: Event) {
  const target = ev.target as HTMLElement;
  const input = target.querySelector("input.field") as HTMLInputElement;
  input?.focus();
}

function selectField(ev: Event) {
  const input = ev.target as HTMLInputElement;
  input.select();
}

function getDaysInMonths(isLeapYear = false) {
  return [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
}

function fixDate({ dd, mm, yyyy }: { dd: string; mm: string; yyyy: string }) {
  if (+mm > 12) mm = "12";
  const isLeapYear = +yyyy % 4 === 0 && +yyyy >= 1000;
  const maxDay = getDaysInMonths(isLeapYear)[+mm - 1];

  if (maxDay && +dd > maxDay) dd = String(maxDay);

  return {
    dd,
    mm,
    yyyy,
  };
}

function toDate() {
  const date = new Date(0);
  if (
    value?.value &&
    value.value?.yyyy?.value &&
    value.value?.mm?.value &&
    value.value?.dd?.value &&
    Number(value.value?.yyyy?.value) &&
    Number(value.value?.mm?.value) &&
    Number(value.value?.dd?.value)
  ) {
    date.setFullYear(
      +value.value.yyyy.value,
      +value.value.mm.value - 1,
      +value.value.dd.value
    );
    date.setHours(0, 0, 0, 0);
    return date;
  }
  return null;
}
function fromDate(date: Date) {
  const dd = date.getDate();
  const mm = date.getMonth() + 1;
  const yyyy = date.getFullYear();
  if (value.value.dd && value.value.mm && value.value.yyyy) {
    value.value.dd.value = String(dd).padStart(value.value.dd.length, "0");
    value.value.mm.value = String(mm).padStart(value.value.mm.length, "0");
    value.value.yyyy.value = String(yyyy < 0 ? 0 : yyyy).padStart(
      value.value.yyyy.length,
      "0"
    );
  }
}
function toEmpty() {
  if (value.value.dd && value.value.mm && value.value.yyyy) {
    value.value.dd.value = "";
    value.value.mm.value = "";
    value.value.yyyy.value = "";
  }
}
</script>

<style scoped>
.mrfokus-input-date {
  display: flex;
  gap: 2px;
  padding: 6px 10px;
  background: var(--di-bg, #f2f4f7);
  border-radius: 10px;
  width: fit-content;
  height: fit-content;
  color: var(--di-primary, #0e1829);
  text-align: center;
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  align-items: center;
  justify-content: space-between;
}

.mrfokus-input-date:focus {
  outline: none;
  border: none;
}

.field {
  background: none;
  padding: 2px;
  border: none;
  display: flex;
  width: fit-content;
  text-align: center;
  outline: none;
}

.field::placeholder {
  color: var(--di-placeholder, #647187);
}

.field:focus::placeholder {
  color: transparent;
}

.field:focus {
  outline: none;
  border-radius: 4px;
  background: var(--di-primary, #0e1829);
  color: var(--di-bg, #fff);
}

.mrfokus-input-date:focus-within {
  outline: 1px solid var(--di-border, #0b182a);
}
</style>
