const packageUrl = "packages://fish-multil-lang";
const Utils = Editor.require(`${packageUrl}/libs/utils.js`);
const path = require("path");
const crypto = require('crypto');
var fs = require("fs");

const electron = require("electron"), browserWindow = electron.remote.BrowserWindow;

let config = {
    cloneGameID: 0,
    cloneGamePath: "",
    newGameID: 0,
    newGamePath: "",
    fileNameExport: "gfConfigLanguage",
    fileTypeExport: ".json",
    spriteType: "cc.Sprite",
    spineType: "sp.Skeleton"
};

const componentConfig = {
    spriteType: "gfLocalizeSprite",
    spineType: "gfLocalizeSpine",
    buttonType: "gfLocalizeButton",
    componentLanguageType: "gfLocalizeNodeAsset"
};

const configLanguage = [
    {text: "English", value: "_en"},
    {text: "Chinese", value: "_zh"},
    {text: "Japan", value: "_ja"},
    {text: "Korean", value: "_ko"},
    {text: "Lao", value: "_lo"},
];

Editor.Panel.extend({
    style: Utils.loadText(Editor.url(`${packageUrl}/run-update-panel/PanelExportLanguage.css`)),

    template: Utils.loadText(Editor.url(`${packageUrl}/run-update-panel/PanelExportLanguage.html`)),

    $: Utils.createHtmlID([
        'btnClone', 'gameID'
    ]),

    async ready() {
        this.idLanguage = {};
        this.$gameID.addEventListener('change', this.onChangeGameID.bind(this));
        let thisWindow = browserWindow.getFocusedWindow();
        this.extensionWindow = Editor.remote.Window.find(thisWindow);
        this.extensionWindow.nativeWin.setTitle("Fish-Update-Language");

        this._vm = new window.Vue({
            el: this.shadowRoot,
            data: {
                languages: [],
                log: "",
                isRelaunch: false
            },
            methods: {
                onSelectLanguage: this.onSelectLanguage.bind(this),
                onClickRun: this.onClickRun.bind(this),
                onClickDebug: this.onClickDebug.bind(this),
                onClickReset: this.clearNodeIdSceneLanguage.bind(this)
            }
        });
        configLanguage.forEach(language => {
            this._vm.languages.push({value: language.value, text: language.text});
        });
    },

    onClickDebug(e) {
        e.stopPropagation();
        if (!this.extensionWindow) {
            let thisWindow = browserWindow.getFocusedWindow();
            this.extensionWindow = Editor.remote.Window.find(thisWindow);
        }

        if (this.extensionWindow)
            this.extensionWindow.openDevTools();
    },

    async onClickRun(e) {
        e.stopPropagation();

        if (this.$gameID.value === "") {
            Editor.Dialog.messageBox({
                type: "error",
                buttons: ["OK"],
                title: "Lỗi rồi mấy chú",
                message: "Công an bắt vì không nhập gameId",
                defaultId: 0,
                cancelId: 0,
                noLink: true
            });
            return false;
        }

        let gameFolder = await Utils.getGameAssetFolder(this.$gameID.value);
        let allSceneGame = await Utils.getSceneByGameFolder(gameFolder);
        const listPrefab = await Utils.getPrefabByGameFolder(gameFolder);
        let sceneLang, indexValue = -1;
        for (let i = 0; i < allSceneGame.length; i++) {
            let item = allSceneGame[i];
            if (item.url.indexOf(this.idLanguage.value) > -1) {
                sceneLang = item;
                indexValue = i;
            }
        }
        if (indexValue === -1) {
            Editor.Dialog.messageBox({
                type: "error",
                buttons: ["OK"],
                title: "Lỗi rồi mấy chú",
                message: "Không tìm thấy file scene chứa ngôn ngữ " + this.idLanguage.text,
                defaultId: 0,
                cancelId: 0,
                noLink: true
            });
            return false;
        }
        let langContext = {};
        allSceneGame.splice(indexValue, 1);
        await this.generateNodeIdForLanguageScene(sceneLang);
        for (const scene of allSceneGame) {
            let sceneContext = await this.updateMultiLanguageByScene(scene, sceneLang);
            Object.assign(langContext, sceneContext);
        }
        if(listPrefab.length > 0) {
            for (const prefab of listPrefab) {
                let sceneContext = await this.updateMultiLanguageByScene(prefab, sceneLang);
                Object.assign(langContext, sceneContext);
            }
        }

        //Export config multi language
        let arrURL = gameFolder.path.split("/");
        arrURL.push(
            "multiLang",
            config.fileNameExport + this.idLanguage.value + config.fileTypeExport
        );
        let exportFilePath = arrURL.join("/");
        Utils.createFile(exportFilePath, JSON.stringify(langContext), true);


        this._vm.log = 'Successfully export file multi language ' + config.fileNameExport + config.fileTypeExport;
        if (this._vm.isRelaunch)
            Utils.relaunch();
    },

    async generateNodeIdForLanguageScene(langScene) {
        let {result: assetLangInfo} = await Utils.queryAssetsInfoByUUID(langScene.uuid);

        const fileSceneLang = fs.readFileSync(assetLangInfo.path, "utf8");
        const sceneLangObjects = JSON.parse(fileSceneLang);

        for (let i = 0; i < sceneLangObjects.length; i++) {
            const item = sceneLangObjects[i];
            if (item["__type__"] !== config.spriteType && item["__type__"] !== config.spineType) continue;
            const itemNode = this.getNodeComponentIdByObject(sceneLangObjects, item);
            if(!itemNode) continue;
            if (itemNode["_componentID"] === componentConfig.componentLanguageType) {
                if (itemNode["nodeID"] === "") {
                    itemNode["nodeID"] = Utils.getRandomUUID();
                }
            }
        }
        Utils.makeDirExist(assetLangInfo.path);
        Utils.saveText(assetLangInfo.path, JSON.stringify(sceneLangObjects));
    },

    async clearNodeIdSceneLanguage () {
        let gameFolder = await Utils.getGameAssetFolder(this.$gameID.value);
        let allSceneGame = await Utils.getSceneByGameFolder(gameFolder);
        let sceneLang, indexValue = -1;
        for (let i = 0; i < allSceneGame.length; i++) {
            let item = allSceneGame[i];
            if (item.url.indexOf(this.idLanguage.value) > -1) {
                sceneLang = item;
                indexValue = i;
            }
        }

        let {result: assetLangInfo} = await Utils.queryAssetsInfoByUUID(sceneLang.uuid);

        const fileSceneLang = fs.readFileSync(assetLangInfo.path, "utf8");
        const sceneLangObjects = JSON.parse(fileSceneLang);

        for (let i = 0; i < sceneLangObjects.length; i++) {
            const item = sceneLangObjects[i];
            if (item["__type__"] !== config.spriteType && item["__type__"] !== config.spineType) continue;
            const itemNode = this.getNodeComponentIdByObject(sceneLangObjects, item);
            if (itemNode["_componentID"] === componentConfig.componentLanguageType) {
                if (itemNode["nodeID"] !== "") {
                    itemNode["nodeID"] = "";
                }
            }
        }
        Utils.makeDirExist(assetLangInfo.path);
        Utils.saveText(assetLangInfo.path, JSON.stringify(sceneLangObjects));
    },

    async updateMultiLanguageByScene(mainScene, langScene) {
        let {result: assetInfo} = await Utils.queryAssetsInfoByUUID(mainScene.uuid);
        let {result: assetLangInfo} = await Utils.queryAssetsInfoByUUID(langScene.uuid);


        const fileSceneLang = fs.readFileSync(assetLangInfo.path, "utf8");
        const sceneLangObjects = JSON.parse(fileSceneLang);
        const spritesLangScene = Utils.getObjectOfSceneByType(sceneLangObjects, "cc.Sprite");
        const spinesLangScene = Utils.getObjectOfSceneByType(sceneLangObjects, "sp.Skeleton");

        const fileScene = fs.readFileSync(assetInfo.path, "utf8");
        const sceneObjects = JSON.parse(fileScene);
        const spritesMainScene = Utils.getObjectOfSceneByType(sceneObjects, "cc.Sprite");
        const buttonsMainScene = Utils.getButtonsOfSceneByType(sceneObjects);
        const spinesMainScene = Utils.getObjectOfSceneByType(sceneObjects, "sp.Skeleton");

        let contextLang = {};

        let dataSprite = {
            sceneObjects: sceneObjects,
            sceneLangObjects: sceneLangObjects,
            spritesLangScene: spritesLangScene,
            spritesMainScene: spritesMainScene
        };

        let dataButton = {
            sceneObjects: sceneObjects,
            sceneLangObjects: sceneLangObjects,
            spritesLangScene: spritesLangScene,
            buttonsMainScene: buttonsMainScene
        };
        let dataSpine = {
            sceneObjects: sceneObjects,
            sceneLangObjects: sceneLangObjects,
            spinesLangScene: spinesLangScene,
            spinesMainScene: spinesMainScene
        };
        Object.assign(contextLang, await this.updateSpriteLanguage(dataSprite));
        Object.assign(contextLang, await this.updateButtonLanguage(dataButton));
        Object.assign(contextLang, await this.updateSpineLanguage(dataSpine));
        // create jsonFile
        Utils.makeDirExist(assetInfo.path);
        Utils.saveText(assetInfo.path, JSON.stringify(sceneObjects));
        return contextLang;
    },

    async updateSpriteLanguage(data) {
        let context = {};
        const {spritesLangScene, sceneLangObjects, spritesMainScene, sceneObjects} = data;
        for (const spriteLang of spritesLangScene) {
            let {result: assetLang} = await Utils.queryAssetsInfoByUUID(Utils.getUUIDSprite(spriteLang));
            const NodeSpriteLang = this.getNodeComponentIdByObject(sceneLangObjects, spriteLang);
            if(!NodeSpriteLang) continue;
            if (NodeSpriteLang["_componentID"] !== componentConfig.componentLanguageType) continue;
            for (const sprite of spritesMainScene) {
                const spriteUUID = Utils.getUUIDSprite(sprite);
                if(!spriteUUID) continue;
                const nodeOfSprite = this.getNodeComponentIdByObject(sceneObjects, sprite);
                if(!nodeOfSprite) continue;
                let {result: assetInfo} = await Utils.queryAssetsInfoByUUID(spriteUUID);
                if (nodeOfSprite["_componentID"] !== componentConfig.spriteType) continue;
                const canUpdateUUID = this.compareURL(assetInfo.url, assetLang.url);
                if (canUpdateUUID) {
                    if (nodeOfSprite.nodeID == "") {
                        nodeOfSprite["nodeID"] = NodeSpriteLang["nodeID"];
                    }
                    context[NodeSpriteLang["nodeID"]] = {
                        "Type": "sprite",
                        "Transform": Utils.exportObjectTransform(sceneObjects, sprite)
                    };
                }
            }

        }
        return context;
    },

    async updateButtonLanguage(data) {
        const {spritesLangScene, sceneLangObjects, buttonsMainScene, sceneObjects} = data;
        let context = {};

        for (const button of buttonsMainScene) {
            let buttons = Utils.getButtonUUID(button);
            if(!buttons) continue;
            await this.updateButtonInfo(buttons);
            let nodeOfButton = this.getNodeComponentIdByObject(sceneObjects, button);
            if(!nodeOfButton) continue;
            if (nodeOfButton["_componentID"] !== componentConfig.buttonType) continue;
            if (nodeOfButton.nodeID === "") {
                const randomUUID = Utils.getRandomUUID();
                nodeOfButton["nodeID"] = randomUUID;
            }
            let transition = {};
            for (const spriteLang of spritesLangScene) {
                let {result: assetLang} = await Utils.queryAssetsInfoByUUID(Utils.getUUIDSprite(spriteLang));
                const NodeSpriteLang = this.getNodeComponentIdByObject(sceneLangObjects, spriteLang);
                if(!NodeSpriteLang) continue;
                if (NodeSpriteLang["_componentID"] !== componentConfig.componentLanguageType) continue;
                for (const buttonInfo in buttons) {
                    const buttonFullInfo = buttons[buttonInfo].assetInfo;
                    let arrButtonName = buttonInfo.split('$');
                    let buttonTransition = arrButtonName.length > 1 ? arrButtonName[1] : arrButtonName[0];
                    const canUpdate = this.compareURL(buttonFullInfo.url, assetLang.url);
                    if (canUpdate) {
                        if (!transition[buttonTransition]) {
                            transition[buttonTransition] = NodeSpriteLang["nodeID"];
                        }
                    }

                }
            }
            context[nodeOfButton.nodeID] = {
                "Type": "button",
                "Transform": Utils.exportObjectTransform(sceneObjects, button),
                "TransitionButton": {}
            };
            Object.assign(context[nodeOfButton.nodeID].TransitionButton, transition);
        }


        return context;
    },

    async updateSpineLanguage(data) {
        const {spinesLangScene, sceneLangObjects, spinesMainScene, sceneObjects} = data;
        let context = {};
        for (const spineLang of spinesLangScene) {
            if(spineLang["_N$skeletonData"] == null) continue;
            const {result: langSpineAsset} = await Utils.queryAssetsInfoByUUID(spineLang["_N$skeletonData"]['__uuid__']);
            const nodeSpineLang = this.getNodeComponentIdByObject(sceneLangObjects, spineLang);
            if(!nodeSpineLang) continue;
            for (const spine of spinesMainScene) {
                if(spine["_N$skeletonData"] == null) continue;
                const {result: mainSpineAsset} = await Utils.queryAssetsInfoByUUID(spine["_N$skeletonData"]['__uuid__']);
                let nodeSpine = this.getNodeComponentIdByObject(sceneObjects, spine);
                if(!nodeSpine) continue;
                const canUpdate = this.compareSpineURL(mainSpineAsset.url, langSpineAsset.url);
                if (canUpdate) {
                    if (nodeSpine["_componentID"] === componentConfig.spineType) {
                        if (nodeSpine.nodeID == "") {
                            nodeSpine.nodeID = nodeSpineLang.nodeID;
                        }
                    }
                    context[nodeSpine.nodeID] = {
                        "Type": "spine",
                        "Transform": Utils.exportObjectTransform(sceneObjects, spine),
                        "Option": Utils.exportSpineOption(spine)
                    };
                }
            }
        }
        return context;
    },


    onChangeGameID() {
        // Editor.log(this.$gameID.value);
    },

    getNodeComponentIdByObject(sceneObject, object) {
        let nodeId = object.node['__id__'];
        const node = sceneObject[nodeId];
        const nodeComponents = node["_components"];
        for (let i = 0; i < nodeComponents.length; i++) {
            const component = sceneObject[nodeComponents[i]['__id__']];
            if (component['_componentID']) return component;
        }
    },

    compareURL(mainURL, langURL) {
        const arrURL = mainURL.split("/");
        const arrLangURL = langURL.split("/");
        return arrLangURL[arrLangURL.length - 2].toString() === arrURL[arrURL.length - 2].toString();

    },

    compareSpineURL(mainURL, langURL) {
        const arrURL = mainURL.split("/");
        const arrLangURL = langURL.split("/");
        return arrLangURL[arrLangURL.length - 1].toString() === arrURL[arrURL.length - 1].toString();
    },

    async updateButtonInfo(buttonAsset) {
        /*
            * hoverSprite: button.hoverSprite["__uuid__"],
            * pressedSprite: button.pressedSprite["__uuid__"],
            * "_N$hoverSprite": button["_N$hoverSprite"]['__uuid__'],
            * "_N$normalSprite": button["_N$normalSprite"]['__uuid__'],
            * "_N$disabledSprite": button["_N$disabledSprite"]['__uuid__'],
            * "_N$pressedSprite": button["_N$pressedSprite"]['__uuid__'],
            * */
        let {
            hoverSprite,
            pressedSprite,
            _N$hoverSprite,
            _N$normalSprite,
            _N$disabledSprite,
            _N$pressedSprite
        } = buttonAsset;
        if(hoverSprite)
        {
            let {result: hoverSpriteInfo} = await Utils.queryAssetsInfoByUUID(hoverSprite.uuid);
            hoverSprite.assetInfo = hoverSpriteInfo;
        }
        if(pressedSprite)
        {
            let {result: pressedSpriteInfo} = await Utils.queryAssetsInfoByUUID(pressedSprite.uuid);
            pressedSprite.assetInfo = pressedSpriteInfo;
        }
        if(_N$hoverSprite)
        {
            let {result: _N$hoverSpriteInfo} = await Utils.queryAssetsInfoByUUID(_N$hoverSprite.uuid);
            _N$hoverSprite.assetInfo = _N$hoverSpriteInfo;
        }
        if(_N$normalSprite)
        {
            let {result: _N$normalSpriteInfo} = await Utils.queryAssetsInfoByUUID(_N$normalSprite.uuid);
            _N$normalSprite.assetInfo = _N$normalSpriteInfo;
        }
        if(_N$disabledSprite)
        {
            let {result: _N$disabledSpriteInfo} = await Utils.queryAssetsInfoByUUID(_N$disabledSprite.uuid);
            _N$disabledSprite.assetInfo = _N$disabledSpriteInfo;
        }
        if(_N$pressedSprite)
        {
            let {result: _N$pressedSpriteInfo} = await Utils.queryAssetsInfoByUUID(_N$pressedSprite.uuid);
            _N$pressedSprite.assetInfo = _N$pressedSpriteInfo;
        }
        return buttonAsset;
    },

    async onSelectLanguage(e) {
        //Editor.log(e.detail.value);
        this.idLanguage = e.detail;
    },
});