module.exports = {
    load() {
        Editor.log("===========Loaded fish-multil-lang===========");
    },

    unload() {
        Editor.log("===========Unloaded fish-multil-lang===========");
    },

    messages:
    {
        reload() {
            Editor.Package.reload('fish-multil-lang');
            Editor.log("===========Reload fish-multil-lang===========");
        },

        run() {
            Editor.Panel.open('fish-multil-lang.run');
        },
    },
};