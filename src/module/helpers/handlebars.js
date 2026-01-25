export const initializeHandlebars = () => {
    registerHandlebarsHelpers();
};

function registerHandlebarsHelpers() {
    Handlebars.registerHelper("removeMarkup", function (text) {
        const markup = /<(.*?)>/gi;
        return text.replace(markup, "");
    });

    /*
    Handlebars.registerHelper("ifIsGM", function (options) {
        return game.user.isGM ? options.fn(this) : options.inverse(this)
    })

    Handlebars.registerHelper("isGM", function (options) {
        return game.user.isGM
    })
    */

    Handlebars.registerHelper("config", function (key) {
        return game.deathwatch.config[key]
    })

    Handlebars.registerHelper("configLookup", function (obj, key) {
        return game.deathwatch.config[obj][key]
    })


    Handlebars.registerHelper("enrich", function (string) {
        return TextEditor.enrichHTML(string, { async: false })
    })


    Handlebars.registerHelper("array", function (array, cls) {
        if (typeof cls == "string")
            return array.map(i => `<a class="${cls}">${i}</a>`).join(`,`)
        else
            return array.join(", ")
    })
}
