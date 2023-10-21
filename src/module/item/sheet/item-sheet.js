export class DeathwatchItemSheet extends ItemSheet {

    get template() {
        console.log(`deathwatch | systems/deathwatch/templates/sheets/${this.item.type}-sheet.html`)
        return `systems/deathwatch/templates/sheets/${this.item.type}-sheet.html`
    }

}