import Glean from "@mozilla/glean/webext";
// @ts-ignore
import { custom } from "./generated/pings";
// @ts-ignore
import { to_lang, from_lang } from "./generated/metadata";

Glean.initialize("bergamot-extension", true, { debug: { logPings: true } });

const _set_meta = (lang_from: string, lang_to: string) => {
  to_lang.set(lang_to);
  from_lang.set(lang_from);
};

const _dynamic_call = (
  category: string,
  name: string,
  method: string,
  value: any = null,
) => {
  import(`./generated/${category}`)
    .then(module => {
      if (value != null) {
        module[name][method](value);
      } else {
        module[name][method]();
      }
    })
    .catch(err => {
      console.log(`Import error: ${err.message}`);
      console.log(`Telemetry error: ${category}_${name} was not sent`);
    });
};

// todo: pings should be sent in parallel, without blocking current thread

export const timing = (
  category: string,
  name: string,
  value: string,
  lang_from: string,
  lang_to: string,
) => {
  _set_meta(lang_from, lang_to);
  // todo: switch to timespan metric type when it is supported
  _dynamic_call(category, name, "record", { temespan: String(value) });
  custom.submit();
};

export const event = (
  category: string,
  name: string,
  lang_from: string,
  lang_to: string,
) => {
  _set_meta(lang_from, lang_to);
  _dynamic_call(category, name, "record");
  custom.submit();
};

export const quantity = (
  category: string,
  name: string,
  value: BigInteger,
  lang_from: string,
  lang_to: string,
) => {
  _set_meta(lang_from, lang_to);
  // todo: switch to quantity metric type when it is supported
  _dynamic_call(category, name, "record", { quantity: String(value) });
  custom.submit();
};

export const increment = (
  category: string,
  name: string,
  lang_from: string,
  lang_to: string,
) => {
  _set_meta(lang_from, lang_to);
  _dynamic_call(category, name, "add");
  custom.submit();
};
