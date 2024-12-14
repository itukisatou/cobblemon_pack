"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var dex_formats_exports = {};
__export(dex_formats_exports, {
  DexFormats: () => DexFormats,
  Format: () => Format,
  RuleTable: () => RuleTable
});
module.exports = __toCommonJS(dex_formats_exports);
var import_lib = require("../lib");
var import_dex_data = require("./dex-data");
var import_tags = require("../data/tags");
const DEFAULT_MOD = "gen9";
class RuleTable extends Map {
  constructor() {
    super();
    this.complexBans = [];
    this.complexTeamBans = [];
    this.checkCanLearn = null;
    this.timer = null;
    this.tagRules = [];
    this.valueRules = /* @__PURE__ */ new Map();
  }
  isBanned(thing) {
    if (this.has(`+${thing}`))
      return false;
    return this.has(`-${thing}`);
  }
  isBannedSpecies(species) {
    if (this.has(`+pokemon:${species.id}`))
      return false;
    if (this.has(`-pokemon:${species.id}`))
      return true;
    if (this.has(`+basepokemon:${(0, import_dex_data.toID)(species.baseSpecies)}`))
      return false;
    if (this.has(`-basepokemon:${(0, import_dex_data.toID)(species.baseSpecies)}`))
      return true;
    for (const tagid in import_tags.Tags) {
      const tag = import_tags.Tags[tagid];
      if (this.has(`-pokemontag:${tagid}`)) {
        if ((tag.speciesFilter || tag.genericFilter)(species))
          return true;
      }
    }
    for (const tagid in import_tags.Tags) {
      const tag = import_tags.Tags[tagid];
      if (this.has(`+pokemontag:${tagid}`)) {
        if ((tag.speciesFilter || tag.genericFilter)(species))
          return false;
      }
    }
    return this.has(`-pokemontag:allpokemon`);
  }
  isRestricted(thing) {
    if (this.has(`+${thing}`))
      return false;
    return this.has(`*${thing}`);
  }
  isRestrictedSpecies(species) {
    if (this.has(`+pokemon:${species.id}`))
      return false;
    if (this.has(`*pokemon:${species.id}`))
      return true;
    if (this.has(`+basepokemon:${(0, import_dex_data.toID)(species.baseSpecies)}`))
      return false;
    if (this.has(`*basepokemon:${(0, import_dex_data.toID)(species.baseSpecies)}`))
      return true;
    for (const tagid in import_tags.Tags) {
      const tag = import_tags.Tags[tagid];
      if (this.has(`*pokemontag:${tagid}`)) {
        if ((tag.speciesFilter || tag.genericFilter)(species))
          return true;
      }
    }
    for (const tagid in import_tags.Tags) {
      const tag = import_tags.Tags[tagid];
      if (this.has(`+pokemontag:${tagid}`)) {
        if ((tag.speciesFilter || tag.genericFilter)(species))
          return false;
      }
    }
    return this.has(`*pokemontag:allpokemon`);
  }
  getTagRules() {
    const tagRules = [];
    for (const ruleid of this.keys()) {
      if (/^[+*-]pokemontag:/.test(ruleid)) {
        const banid = ruleid.slice(12);
        if (banid === "allpokemon" || banid === "allitems" || banid === "allmoves" || banid === "allabilities" || banid === "allnatures") {
        } else {
          tagRules.push(ruleid);
        }
      } else if ("+*-".includes(ruleid.charAt(0)) && ruleid.slice(1) === "nonexistent") {
        tagRules.push(ruleid.charAt(0) + "pokemontag:nonexistent");
      }
    }
    this.tagRules = tagRules.reverse();
    return this.tagRules;
  }
  /**
   * - non-empty string: banned, string is the reason
   * - '': whitelisted
   * - null: neither whitelisted nor banned
   */
  check(thing, setHas = null) {
    if (this.has(`+${thing}`))
      return "";
    if (setHas)
      setHas[thing] = true;
    return this.getReason(`-${thing}`);
  }
  getReason(key) {
    const source = this.get(key);
    if (source === void 0)
      return null;
    if (key === "-nonexistent" || key.startsWith("obtainable")) {
      return "not obtainable";
    }
    return source ? `banned by ${source}` : `banned`;
  }
  blame(key) {
    const source = this.get(key);
    return source ? ` from ${source}` : ``;
  }
  getComplexBanIndex(complexBans, rule) {
    const ruleId = (0, import_dex_data.toID)(rule);
    let complexBanIndex = -1;
    for (let i = 0; i < complexBans.length; i++) {
      if ((0, import_dex_data.toID)(complexBans[i][0]) === ruleId) {
        complexBanIndex = i;
        break;
      }
    }
    return complexBanIndex;
  }
  addComplexBan(rule, source, limit, bans) {
    const complexBanIndex = this.getComplexBanIndex(this.complexBans, rule);
    if (complexBanIndex !== -1) {
      if (this.complexBans[complexBanIndex][2] === Infinity)
        return;
      this.complexBans[complexBanIndex] = [rule, source, limit, bans];
    } else {
      this.complexBans.push([rule, source, limit, bans]);
    }
  }
  addComplexTeamBan(rule, source, limit, bans) {
    const complexBanTeamIndex = this.getComplexBanIndex(this.complexTeamBans, rule);
    if (complexBanTeamIndex !== -1) {
      if (this.complexTeamBans[complexBanTeamIndex][2] === Infinity)
        return;
      this.complexTeamBans[complexBanTeamIndex] = [rule, source, limit, bans];
    } else {
      this.complexTeamBans.push([rule, source, limit, bans]);
    }
  }
  /** After a RuleTable has been filled out, resolve its hardcoded numeric properties */
  resolveNumbers(format, dex) {
    const gameTypeMinTeamSize = ["triples", "rotation"].includes(format.gameType) ? 3 : format.gameType === "doubles" ? 2 : 1;
    this.minTeamSize = Number(this.valueRules.get("minteamsize")) || 0;
    this.maxTeamSize = Number(this.valueRules.get("maxteamsize")) || 6;
    this.pickedTeamSize = Number(this.valueRules.get("pickedteamsize")) || null;
    this.maxTotalLevel = Number(this.valueRules.get("maxtotallevel")) || null;
    this.maxMoveCount = Number(this.valueRules.get("maxmovecount")) || 4;
    this.minSourceGen = Number(this.valueRules.get("minsourcegen")) || 1;
    this.minLevel = Number(this.valueRules.get("minlevel")) || 1;
    this.maxLevel = Number(this.valueRules.get("maxlevel")) || 100;
    this.defaultLevel = Number(this.valueRules.get("defaultlevel")) || 0;
    this.adjustLevel = Number(this.valueRules.get("adjustlevel")) || null;
    this.adjustLevelDown = Number(this.valueRules.get("adjustleveldown")) || null;
    this.evLimit = Number(this.valueRules.get("evlimit")) || null;
    if (this.valueRules.get("pickedteamsize") === "Auto") {
      this.pickedTeamSize = ["doubles", "rotation"].includes(format.gameType) ? 4 : format.gameType === "triples" ? 6 : 3;
    }
    if (this.valueRules.get("evlimit") === "Auto") {
      this.evLimit = dex.gen > 2 ? 510 : null;
      if (format.mod === "gen7letsgo") {
        this.evLimit = this.has("allowavs") ? null : 0;
      }
    }
    if (this.maxTeamSize > 24) {
      throw new Error(`Max team size ${this.maxTeamSize}${this.blame("maxteamsize")} is unsupported (we only support up to 24).`);
    }
    if (this.maxLevel > 99999) {
      throw new Error(`Max level ${this.maxLevel}${this.blame("maxlevel")} is unsupported (we only support up to 99999)`);
    }
    if (this.maxMoveCount > 24) {
      throw new Error(`Max move count ${this.maxMoveCount}${this.blame("maxmovecount")} is unsupported (we only support up to 24)`);
    }
    if (!this.defaultLevel) {
      const maxTeamSize = this.pickedTeamSize || this.maxTeamSize;
      if (this.maxTotalLevel && this.maxLevel > 100 && this.maxLevel * maxTeamSize > this.maxTotalLevel) {
        this.defaultLevel = 100;
      } else {
        this.defaultLevel = this.maxLevel;
      }
    }
    if (this.minTeamSize && this.minTeamSize < gameTypeMinTeamSize) {
      throw new Error(`Min team size ${this.minTeamSize}${this.blame("minteamsize")} must be at least ${gameTypeMinTeamSize} for a ${format.gameType} game.`);
    }
    if (this.pickedTeamSize && this.pickedTeamSize < gameTypeMinTeamSize) {
      throw new Error(`Chosen team size ${this.pickedTeamSize}${this.blame("pickedteamsize")} must be at least ${gameTypeMinTeamSize} for a ${format.gameType} game.`);
    }
    if (this.minTeamSize && this.pickedTeamSize && this.minTeamSize < this.pickedTeamSize) {
      throw new Error(`Min team size ${this.minTeamSize}${this.blame("minteamsize")} is lower than chosen team size ${this.pickedTeamSize}${this.blame("pickedteamsize")}.`);
    }
    if (!this.minTeamSize)
      this.minTeamSize = Math.max(gameTypeMinTeamSize, this.pickedTeamSize || 0);
    if (this.maxTeamSize < gameTypeMinTeamSize) {
      throw new Error(`Max team size ${this.maxTeamSize}${this.blame("maxteamsize")} must be at least ${gameTypeMinTeamSize} for a ${format.gameType} game.`);
    }
    if (this.maxTeamSize < this.minTeamSize) {
      throw new Error(`Max team size ${this.maxTeamSize}${this.blame("maxteamsize")} must be at least min team size ${this.minTeamSize}${this.blame("minteamsize")}.`);
    }
    if (this.minLevel > this.maxLevel) {
      throw new Error(`Min level ${this.minLevel}${this.blame("minlevel")} should not be above max level ${this.maxLevel}${this.blame("maxlevel")}.`);
    }
    if (this.defaultLevel > this.maxLevel) {
      throw new Error(`Default level ${this.defaultLevel}${this.blame("defaultlevel")} should not be above max level ${this.maxLevel}${this.blame("maxlevel")}.`);
    }
    if (this.defaultLevel < this.minLevel) {
      throw new Error(`Default level ${this.defaultLevel}${this.blame("defaultlevel")} should not be below min level ${this.minLevel}${this.blame("minlevel")}.`);
    }
    if (this.adjustLevelDown && this.adjustLevelDown >= this.maxLevel) {
      throw new Error(`Adjust Level Down ${this.adjustLevelDown}${this.blame("adjustleveldown")} will have no effect because it's not below max level ${this.maxLevel}${this.blame("maxlevel")}.`);
    }
    if (this.adjustLevel && this.valueRules.has("minlevel")) {
      throw new Error(`Min Level ${this.minLevel}${this.blame("minlevel")} will have no effect because you're using Adjust Level ${this.adjustLevel}${this.blame("adjustlevel")}.`);
    }
    if (this.evLimit && this.evLimit >= 1512) {
      throw new Error(`EV Limit ${this.evLimit}${this.blame("evlimit")} will have no effect because it's not lower than 1512, the maximum possible combination of 252 EVs in every stat (if you currently have an EV limit, use "! EV Limit" to remove the limit).`);
    }
    if (this.evLimit && this.evLimit < 0) {
      throw new Error(`EV Limit ${this.evLimit}${this.blame("evlimit")} can't be less than 0 (you might have meant: "! EV Limit" to remove the limit, or "EV Limit = 0" to ban EVs).`);
    }
    if (format.cupLevelLimit) {
      throw new Error(`cupLevelLimit.range[0], cupLevelLimit.range[1], cupLevelLimit.total are now rules, respectively: "Min Level = NUMBER", "Max Level = NUMBER", and "Max Total Level = NUMBER"`);
    }
    if (format.teamLength) {
      throw new Error(`teamLength.validate[0], teamLength.validate[1], teamLength.battle are now rules, respectively: "Min Team Size = NUMBER", "Max Team Size = NUMBER", and "Picked Team Size = NUMBER"`);
    }
    if (format.minSourceGen) {
      throw new Error(`minSourceGen is now a rule: "Min Source Gen = NUMBER"`);
    }
    if (format.maxLevel) {
      throw new Error(`maxLevel is now a rule: "Max Level = NUMBER"`);
    }
    if (format.defaultLevel) {
      throw new Error(`defaultLevel is now a rule: "Default Level = NUMBER"`);
    }
    if (format.forcedLevel) {
      throw new Error(`forcedLevel is now a rule: "Adjust Level = NUMBER"`);
    }
    if (format.maxForcedLevel) {
      throw new Error(`maxForcedLevel is now a rule: "Adjust Level Down = NUMBER"`);
    }
  }
  hasComplexBans() {
    return this.complexBans?.length > 0 || this.complexTeamBans?.length > 0;
  }
}
class Format extends import_dex_data.BasicEffect {
  constructor(data) {
    super(data);
    data = this;
    this.mod = import_lib.Utils.getString(data.mod) || "gen9";
    this.effectType = import_lib.Utils.getString(data.effectType) || "Format";
    this.debug = !!data.debug;
    this.rated = typeof data.rated === "string" ? data.rated : data.rated !== false;
    this.gameType = data.gameType || "singles";
    this.ruleset = data.ruleset || [];
    this.baseRuleset = data.baseRuleset || [];
    this.banlist = data.banlist || [];
    this.restricted = data.restricted || [];
    this.unbanlist = data.unbanlist || [];
    this.customRules = data.customRules || null;
    this.ruleTable = null;
    this.onBegin = data.onBegin || void 0;
    this.noLog = !!data.noLog;
    this.playerCount = this.gameType === "multi" || this.gameType === "freeforall" ? 4 : 2;
  }
}
function mergeFormatLists(main, custom) {
  const result = [];
  const build = [];
  let current = { section: "", formats: [] };
  for (const element of main) {
    if (element.section) {
      current = { section: element.section, column: element.column, formats: [] };
      build.push(current);
    } else if (element.name) {
      current.formats.push(element);
    }
  }
  if (custom !== void 0) {
    for (const element of custom) {
      if (element.section) {
        current = build.find((e) => e.section === element.section);
        if (current === void 0) {
          current = { section: element.section, column: element.column, formats: [] };
          build.push(current);
        }
      } else if (element.name) {
        current.formats.push(element);
      }
    }
  }
  for (const element of build) {
    result.push({ section: element.section, column: element.column }, ...element.formats);
  }
  return result;
}
class DexFormats {
  constructor(dex) {
    this.rulesetCache = /* @__PURE__ */ new Map();
    this.dex = dex;
    this.formatsListCache = null;
  }
  load() {
    if (!this.dex.isBase)
      throw new Error(`This should only be run on the base mod`);
    this.dex.includeMods();
    if (this.formatsListCache)
      return this;
    const formatsList = [];
    let customFormats;
    try {
      customFormats = require(`${__dirname}/../config/custom-formats`).Formats;
      if (!Array.isArray(customFormats)) {
        throw new TypeError(`Exported property 'Formats' from "./config/custom-formats.ts" must be an array`);
      }
    } catch (e) {
      if (e.code !== "MODULE_NOT_FOUND" && e.code !== "ENOENT") {
        throw e;
      }
    }
    let Formats = require(`${__dirname}/../config/formats`).Formats;
    if (!Array.isArray(Formats)) {
      throw new TypeError(`Exported property 'Formats' from "./config/formats.ts" must be an array`);
    }
    if (customFormats)
      Formats = mergeFormatLists(Formats, customFormats);
    let section = "";
    let column = 1;
    for (const [i, format] of Formats.entries()) {
      const id = (0, import_dex_data.toID)(format.name);
      if (format.section)
        section = format.section;
      if (format.column)
        column = format.column;
      if (!format.name && format.section)
        continue;
      if (!id) {
        throw new RangeError(`Format #${i + 1} must have a name with alphanumeric characters, not '${format.name}'`);
      }
      if (!format.section)
        format.section = section;
      if (!format.column)
        format.column = column;
      if (this.rulesetCache.has(id))
        throw new Error(`Format #${i + 1} has a duplicate ID: '${id}'`);
      format.effectType = "Format";
      format.baseRuleset = format.ruleset ? format.ruleset.slice() : [];
      if (format.challengeShow === void 0)
        format.challengeShow = true;
      if (format.searchShow === void 0)
        format.searchShow = true;
      if (format.tournamentShow === void 0)
        format.tournamentShow = true;
      if (format.bestOfDefault === void 0)
        format.bestOfDefault = false;
      if (format.mod === void 0)
        format.mod = "gen9";
      if (!this.dex.dexes[format.mod])
        throw new Error(`Format "${format.name}" requires nonexistent mod: '${format.mod}'`);
      const ruleset = new Format(format);
      this.rulesetCache.set(id, ruleset);
      formatsList.push(ruleset);
    }
    this.formatsListCache = formatsList;
    return this;
  }
  /**
   * Returns a sanitized format ID if valid, or throws if invalid.
   */
  validate(name) {
    const [formatName, customRulesString] = name.split("@@@", 2);
    const format = this.get(formatName);
    if (!format.exists)
      throw new Error(`Unrecognized format "${formatName}"`);
    if (!customRulesString)
      return format.id;
    const ruleTable = this.getRuleTable(format);
    const customRules = customRulesString.split(",").map((rule) => {
      rule = rule.replace(/[\r\n|]*/g, "").trim();
      const ruleSpec = this.validateRule(rule);
      if (typeof ruleSpec === "string" && ruleTable.has(ruleSpec))
        return null;
      return rule;
    }).filter(Boolean);
    if (!customRules.length)
      throw new Error(`The format already has your custom rules`);
    const validatedFormatid = format.id + "@@@" + customRules.join(",");
    const moddedFormat = this.get(validatedFormatid, true);
    this.getRuleTable(moddedFormat);
    return validatedFormatid;
  }
  get(name, isTrusted = false) {
    if (name && typeof name !== "string")
      return name;
    name = (name || "").trim();
    let id = (0, import_dex_data.toID)(name);
    if (!name.includes("@@@")) {
      const ruleset = this.rulesetCache.get(id);
      if (ruleset)
        return ruleset;
    }
    if (this.dex.data.Aliases.hasOwnProperty(id)) {
      name = this.dex.data.Aliases[id];
      id = (0, import_dex_data.toID)(name);
    }
    if (this.dex.data.Rulesets.hasOwnProperty(DEFAULT_MOD + id)) {
      id = DEFAULT_MOD + id;
    }
    let supplementaryAttributes = null;
    if (name.includes("@@@")) {
      if (!isTrusted) {
        try {
          name = this.validate(name);
          isTrusted = true;
        } catch {
        }
      }
      const [newName, customRulesString] = name.split("@@@", 2);
      name = newName.trim();
      id = (0, import_dex_data.toID)(name);
      if (isTrusted && customRulesString) {
        supplementaryAttributes = {
          customRules: customRulesString.split(","),
          searchShow: false
        };
      }
    }
    let effect;
    if (this.dex.data.Rulesets.hasOwnProperty(id)) {
      effect = new Format({ name, ...this.dex.data.Rulesets[id], ...supplementaryAttributes });
    } else {
      effect = new Format({ id, name, exists: false });
    }
    return effect;
  }
  all() {
    this.load();
    return this.formatsListCache;
  }
  getRuleTable(format, depth = 1, repeals) {
    if (format.ruleTable && !repeals)
      return format.ruleTable;
    if (format.name.length > 50) {
      throw new Error(`Format "${format.name}" has a name longer than 50 characters`);
    }
    if (depth === 1) {
      const dex = this.dex.mod(format.mod);
      if (dex !== this.dex) {
        return dex.formats.getRuleTable(format, 2, repeals);
      }
    }
    const ruleTable = new RuleTable();
    const ruleset = format.ruleset.slice();
    for (const ban of format.banlist) {
      ruleset.push("-" + ban);
    }
    for (const ban of format.restricted) {
      ruleset.push("*" + ban);
    }
    for (const ban of format.unbanlist) {
      ruleset.push("+" + ban);
    }
    if (format.customRules) {
      ruleset.push(...format.customRules);
    }
    if (format.checkCanLearn) {
      ruleTable.checkCanLearn = [format.checkCanLearn, format.name];
    }
    if (format.timer) {
      ruleTable.timer = [format.timer, format.name];
    }
    for (const rule of ruleset) {
      if (rule.startsWith("!") && !rule.startsWith("!!")) {
        const ruleSpec = this.validateRule(rule, format);
        if (!repeals)
          repeals = /* @__PURE__ */ new Map();
        repeals.set(ruleSpec.slice(1), depth);
      }
    }
    for (const rule of ruleset) {
      const ruleSpec = this.validateRule(rule, format);
      if (typeof ruleSpec !== "string") {
        if (ruleSpec[0] === "complexTeamBan") {
          const complexTeamBan = ruleSpec.slice(1);
          ruleTable.addComplexTeamBan(complexTeamBan[0], complexTeamBan[1], complexTeamBan[2], complexTeamBan[3]);
        } else if (ruleSpec[0] === "complexBan") {
          const complexBan = ruleSpec.slice(1);
          ruleTable.addComplexBan(complexBan[0], complexBan[1], complexBan[2], complexBan[3]);
        } else {
          throw new Error(`Unrecognized rule spec ${ruleSpec}`);
        }
        continue;
      }
      if (rule.startsWith("!") && !rule.startsWith("!!")) {
        const repealDepth = repeals.get(ruleSpec.slice(1));
        if (repealDepth === void 0)
          throw new Error(`Multiple "${rule}" rules in ${format.name}`);
        if (repealDepth === depth) {
          throw new Error(`Rule "${rule}" did nothing because "${rule.slice(1)}" is not in effect`);
        }
        if (repealDepth === -depth)
          repeals.delete(ruleSpec.slice(1));
        continue;
      }
      if ("+*-".includes(ruleSpec.charAt(0))) {
        if (ruleTable.has(ruleSpec)) {
          throw new Error(`Rule "${rule}" in "${format.name}" already exists in "${ruleTable.get(ruleSpec) || format.name}"`);
        }
        for (const prefix of "+*-")
          ruleTable.delete(prefix + ruleSpec.slice(1));
        ruleTable.set(ruleSpec, "");
        continue;
      }
      let [formatid, value] = ruleSpec.split("=");
      const subformat = this.get(formatid);
      const repealAndReplace = ruleSpec.startsWith("!!");
      if (repeals?.has(subformat.id)) {
        repeals.set(subformat.id, -Math.abs(repeals.get(subformat.id)));
        continue;
      }
      if (subformat.hasValue) {
        if (value === void 0)
          throw new Error(`Rule "${ruleSpec}" should have a value (like "${ruleSpec} = something")`);
        if (value === "Current Gen")
          value = `${this.dex.gen}`;
        if ((subformat.id === "pickedteamsize" || subformat.id === "evlimit") && value === "Auto") {
        } else if (subformat.hasValue === "integer" || subformat.hasValue === "positive-integer") {
          const intValue = parseInt(value);
          if (isNaN(intValue) || value !== `${intValue}`) {
            throw new Error(`In rule "${ruleSpec}", "${value}" must be an integer number.`);
          }
        }
        if (subformat.hasValue === "positive-integer") {
          if (parseInt(value) === 0) {
            throw new Error(`In rule "${ruleSpec}", "${value}" must be positive (to remove it, use the rule "! ${subformat.name}").`);
          }
          if (parseInt(value) <= 0) {
            throw new Error(`In rule "${ruleSpec}", "${value}" must be positive.`);
          }
        }
        const oldValue = ruleTable.valueRules.get(subformat.id);
        if (oldValue === value) {
          throw new Error(`Rule "${ruleSpec}" is redundant with existing rule "${subformat.id}=${value}"${ruleTable.blame(subformat.id)}.`);
        } else if (repealAndReplace) {
          if (oldValue === void 0) {
            if (subformat.mutuallyExclusiveWith && ruleTable.valueRules.has(subformat.mutuallyExclusiveWith)) {
              if (this.dex.formats.get(subformat.mutuallyExclusiveWith).ruleset.length) {
                throw new Error(`This format does not support "!!"`);
              }
              ruleTable.valueRules.delete(subformat.mutuallyExclusiveWith);
              ruleTable.delete(subformat.mutuallyExclusiveWith);
            } else {
              throw new Error(`Rule "${ruleSpec}" is not replacing anything (it should not have "!!")`);
            }
          }
        } else {
          if (oldValue !== void 0) {
            throw new Error(`Rule "${ruleSpec}" conflicts with "${subformat.id}=${oldValue}"${ruleTable.blame(subformat.id)} (Use "!! ${ruleSpec}" to override "${subformat.id}=${oldValue}".)`);
          }
          if (subformat.mutuallyExclusiveWith && ruleTable.valueRules.has(subformat.mutuallyExclusiveWith)) {
            const oldRule = `"${subformat.mutuallyExclusiveWith}=${ruleTable.valueRules.get(subformat.mutuallyExclusiveWith)}"`;
            throw new Error(`Format can't simultaneously have "${ruleSpec}" and ${oldRule}${ruleTable.blame(subformat.mutuallyExclusiveWith)} (Use "!! ${ruleSpec}" to override ${oldRule}.)`);
          }
        }
        ruleTable.valueRules.set(subformat.id, value);
      } else {
        if (value !== void 0)
          throw new Error(`Rule "${ruleSpec}" should not have a value (no equals sign)`);
        if (repealAndReplace)
          throw new Error(`"!!" is not supported for this rule`);
        if (ruleTable.has(subformat.id) && !repealAndReplace) {
          throw new Error(`Rule "${rule}" in "${format.name}" already exists in "${ruleTable.get(subformat.id) || format.name}"`);
        }
      }
      ruleTable.set(subformat.id, "");
      if (depth > 16) {
        throw new Error(`Excessive ruleTable recursion in ${format.name}: ${ruleSpec} of ${format.ruleset}`);
      }
      const subRuleTable = this.getRuleTable(subformat, depth + 1, repeals);
      for (const [ruleid, sourceFormat] of subRuleTable) {
        if (!repeals?.has(ruleid)) {
          const newValue = subRuleTable.valueRules.get(ruleid);
          const oldValue = ruleTable.valueRules.get(ruleid);
          if (newValue !== void 0) {
            const subSubFormat = this.get(ruleid);
            if (subSubFormat.mutuallyExclusiveWith && ruleTable.valueRules.has(subSubFormat.mutuallyExclusiveWith)) {
              throw new Error(`Rule "${ruleid}=${newValue}" from ${subformat.name}${subRuleTable.blame(ruleid)} conflicts with "${subSubFormat.mutuallyExclusiveWith}=${ruleTable.valueRules.get(subSubFormat.mutuallyExclusiveWith)}"${ruleTable.blame(subSubFormat.mutuallyExclusiveWith)} (Repeal one with ! before adding another)`);
            }
            if (newValue !== oldValue) {
              if (oldValue !== void 0) {
                throw new Error(`Rule "${ruleid}=${newValue}" from ${subformat.name}${subRuleTable.blame(ruleid)} conflicts with "${ruleid}=${oldValue}"${ruleTable.blame(ruleid)} (Repeal one with ! before adding another)`);
              }
              ruleTable.valueRules.set(ruleid, newValue);
            }
          }
          ruleTable.set(ruleid, sourceFormat || subformat.name);
        }
      }
      for (const [subRule, source, limit, bans] of subRuleTable.complexBans) {
        ruleTable.addComplexBan(subRule, source || subformat.name, limit, bans);
      }
      for (const [subRule, source, limit, bans] of subRuleTable.complexTeamBans) {
        ruleTable.addComplexTeamBan(subRule, source || subformat.name, limit, bans);
      }
      if (subRuleTable.checkCanLearn) {
        if (ruleTable.checkCanLearn) {
          throw new Error(
            `"${format.name}" has conflicting move validation rules from "${ruleTable.checkCanLearn[1]}" and "${subRuleTable.checkCanLearn[1]}"`
          );
        }
        ruleTable.checkCanLearn = subRuleTable.checkCanLearn;
      }
      if (subRuleTable.timer) {
        if (ruleTable.timer) {
          throw new Error(
            `"${format.name}" has conflicting timer validation rules from "${ruleTable.timer[1]}" and "${subRuleTable.timer[1]}"`
          );
        }
        ruleTable.timer = subRuleTable.timer;
      }
    }
    ruleTable.getTagRules();
    ruleTable.resolveNumbers(format, this.dex);
    const canMegaEvo = this.dex.gen <= 7 || ruleTable.has("+pokemontag:past");
    if (ruleTable.has("obtainableformes") && canMegaEvo && ruleTable.isBannedSpecies(this.dex.species.get("rayquazamega")) && !ruleTable.isBannedSpecies(this.dex.species.get("rayquaza"))) {
      ruleTable.set("megarayquazaclause", "");
    }
    for (const rule of ruleTable.keys()) {
      if ("+*-!".includes(rule.charAt(0)))
        continue;
      const subFormat = this.dex.formats.get(rule);
      if (subFormat.exists) {
        const value = subFormat.onValidateRule?.call({ format, ruleTable, dex: this.dex }, ruleTable.valueRules.get(rule));
        if (typeof value === "string")
          ruleTable.valueRules.set(subFormat.id, value);
      }
    }
    if (!repeals)
      format.ruleTable = ruleTable;
    return ruleTable;
  }
  validateRule(rule, format = null) {
    if (rule !== rule.trim())
      throw new Error(`Rule "${rule}" should be trimmed`);
    switch (rule.charAt(0)) {
      case "-":
      case "*":
      case "+":
        if (rule.slice(1).includes(">") || rule.slice(1).includes("+")) {
          let buf = rule.slice(1);
          const gtIndex = buf.lastIndexOf(">");
          let limit = rule.startsWith("+") ? Infinity : 0;
          if (gtIndex >= 0 && /^[0-9]+$/.test(buf.slice(gtIndex + 1).trim())) {
            if (limit === 0)
              limit = parseInt(buf.slice(gtIndex + 1));
            buf = buf.slice(0, gtIndex);
          }
          let checkTeam = buf.includes("++");
          const banNames = buf.split(checkTeam ? "++" : "+").map((v) => v.trim());
          if (banNames.length === 1 && limit > 0)
            checkTeam = true;
          const innerRule = banNames.join(checkTeam ? " ++ " : " + ");
          const bans = banNames.map((v) => this.validateBanRule(v));
          if (checkTeam) {
            return ["complexTeamBan", innerRule, "", limit, bans];
          }
          if (bans.length > 1 || limit > 0) {
            return ["complexBan", innerRule, "", limit, bans];
          }
          throw new Error(`Confusing rule ${rule}`);
        }
        return rule.charAt(0) + this.validateBanRule(rule.slice(1));
      default:
        const [ruleName, value] = rule.split("=");
        let id = (0, import_dex_data.toID)(ruleName);
        const ruleset = this.dex.formats.get(id);
        if (!ruleset.exists) {
          throw new Error(`Unrecognized rule "${rule}"`);
        }
        if (typeof value === "string")
          id = `${id}=${value.trim()}`;
        if (rule.startsWith("!!"))
          return `!!${id}`;
        if (rule.startsWith("!"))
          return `!${id}`;
        return id;
    }
  }
  validPokemonTag(tagid) {
    const tag = import_tags.Tags.hasOwnProperty(tagid) && import_tags.Tags[tagid];
    if (!tag)
      return false;
    return !!(tag.speciesFilter || tag.genericFilter);
  }
  validateBanRule(rule) {
    let id = (0, import_dex_data.toID)(rule);
    if (id === "unreleased")
      return "unreleased";
    if (id === "nonexistent")
      return "nonexistent";
    const matches = [];
    let matchTypes = ["pokemon", "move", "ability", "item", "nature", "pokemontag"];
    for (const matchType of matchTypes) {
      if (rule.startsWith(`${matchType}:`)) {
        matchTypes = [matchType];
        id = id.slice(matchType.length);
        break;
      }
    }
    const ruleid = id;
    if (this.dex.data.Aliases.hasOwnProperty(id))
      id = (0, import_dex_data.toID)(this.dex.data.Aliases[id]);
    for (const matchType of matchTypes) {
      if (matchType === "item" && ruleid === "noitem")
        return "item:noitem";
      let table;
      switch (matchType) {
        case "pokemon":
          table = this.dex.data.Pokedex;
          break;
        case "move":
          table = this.dex.data.Moves;
          break;
        case "item":
          table = this.dex.data.Items;
          break;
        case "ability":
          table = this.dex.data.Abilities;
          break;
        case "nature":
          table = this.dex.data.Natures;
          break;
        case "pokemontag":
          const validTags = [
            // all
            "allpokemon",
            "allitems",
            "allmoves",
            "allabilities",
            "allnatures"
          ];
          if (validTags.includes(ruleid) || this.validPokemonTag(ruleid)) {
            matches.push("pokemontag:" + ruleid);
          }
          continue;
        default:
          throw new Error(`Unrecognized match type.`);
      }
      if (table.hasOwnProperty(id)) {
        if (matchType === "pokemon") {
          const species = table[id];
          if ((species.otherFormes || species.cosmeticFormes) && ruleid !== species.id + (0, import_dex_data.toID)(species.baseForme)) {
            matches.push("basepokemon:" + id);
            continue;
          }
        }
        matches.push(matchType + ":" + id);
      } else if (matchType === "pokemon" && id.endsWith("base")) {
        id = id.slice(0, -4);
        if (table.hasOwnProperty(id)) {
          matches.push("pokemon:" + id);
        }
      }
    }
    if (matches.length > 1) {
      throw new Error(`More than one thing matches "${rule}"; please specify one of: ` + matches.join(", "));
    }
    if (matches.length < 1) {
      throw new Error(`Nothing matches "${rule}"`);
    }
    return matches[0];
  }
}
//# sourceMappingURL=dex-formats.js.map
