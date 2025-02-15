import CONSTANTS from "../constants.js";
import logger from "../logger.js";
import utils from "../utils.js";
import { Pathmuncher } from "./Pathmuncher.js";

export class PathmuncherImporter extends FormApplication {

  constructor(options, actor) {
    super(options);
    this.actor = game.actors.get(actor.id ? actor.id : actor._id);
    this.backup = duplicate(this.actor);
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.title = game.i18n.localize(`${CONSTANTS.FLAG_NAME}.Dialogs.PathmuncherImporter.Title`);
    options.template = `${CONSTANTS.PATH}/templates/pathmuncher.hbs`;
    options.classes = ["pathmuncher"];
    options.width = 400;
    options.closeOnSubmit = false;
    return options;
  }

  /** @override */
  async getData() {
    const flags = utils.getFlags(this.actor);

    return {
      flags,
      id: flags?.pathbuilderId ?? "",
      actor: this.actor,
    };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }

  static _updateProgress(total, count, type) {
    const localizedType = `pathmuncher.Label.${type}`;
    $(".import-progress-bar")
      .width(`${Math.trunc((count / total) * 100)}%`)
      .html(
        `<span>${game.i18n.localize("pathmuncher.Label.Working")} (${game.i18n.localize(localizedType)})...</span>`
      );
  }

  async _updateObject(event, formData) {
    const pathbuilderId = formData.textBoxBuildID;

    const options = {
      pathbuilderId,
      addMoney: formData.checkBoxMoney,
      addFeats: formData.checkBoxFeats,
      addSpells: formData.checkBoxSpells,
      addEquipment: formData.checkBoxEquipment,
      addTreasure: formData.checkBoxTreasure,
      addLores: formData.checkBoxLores,
      addWeapons: formData.checkBoxWeapons,
      addArmor: formData.checkBoxArmor,
      addDeity: formData.checkBoxDeity,
      addName: formData.checkBoxName,
      addClass: formData.checkBoxClass,
      addBackground: formData.checkBoxBackground,
      addHeritage: formData.checkBoxHeritage,
      addAncestry: formData.checkBoxAncestry,
      askForChoices: formData.checkBoxAskForChoices,
    };
    logger.debug("Pathmuncher options", options);

    await utils.setFlags(this.actor, options);

    const pathmuncher = new Pathmuncher(this.actor, options);
    await pathmuncher.fetchPathbuilder(pathbuilderId);
    logger.debug("Pathmuncher Source", pathmuncher.source);
    await pathmuncher.processCharacter();
    logger.debug("Post processed character", pathmuncher);
    await pathmuncher.updateActor();
    logger.debug("Final import details", {
      actor: this.actor,
      pathmuncher,
      options,
      pathbuilderSource: pathmuncher.source,
      pathbuilderId,
    });
    this.close();
    await pathmuncher.postImportCheck();
  }

}
