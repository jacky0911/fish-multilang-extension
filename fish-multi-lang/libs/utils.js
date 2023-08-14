const fs = require("fs-extra");
const pathUtil = require("path");
const assetUtils = Editor.require("packages://assets/panel/utils/utils");
const electron = require('electron');
const crypto = require("crypto");

const Utils = {

    loadText(path) {
        if (!fs.existsSync(path))
            return "";
        let file = fs.readFileSync(path, 'utf8');
        return file;
    },

    saveText(path, text) {
        fs.writeFileSync(path, text, 'utf8');
    },

    createHtmlID(arr) {
        let obj = {};
        for (let i = 0; i < arr.length; i++) {
            obj[arr[i]] = "#" + arr[i];
        }
        return obj;
    },

    makeDirExist(dir) {
        if (fs.existsSync(dir)) {
            return true;
        }
        try {
            //fs.mkdirSync(dir, { recursive: true });
            fs.ensureDirSync(dir);
            return true;
        } catch (e) {
            console.error('error: ', e);
            return false;
        }
    },

    readFile(src) {

    },

    createFile(dest, data = [], overWrite = true) {
        if (!overWrite && fs.existsSync(dest))
            return;
        Utils.makeDirExist(pathUtil.dirname(dest));
        fs.writeFileSync(dest, data);
    },

    isUUID(txt) {
        return Editor.Utils.UuidUtils.isUuid(txt);
    },

    compressUUID(txt) {
        return Editor.Utils.UuidUtils.compressUuid(txt);
    },

    decompressUUID(txt) {
        return Editor.Utils.UuidUtils.decompressUuid(txt);
    },

    queryAssets(pattern, type) {
        // Example:
        //- pattern: "db://**/*.pac"
        //- type:
        //   + ["scene", "sprite-frame"]
        //   + "texture"
        return new Promise((resolve, reject) => {
            Editor.assetdb.queryAssets(pattern, type, (err, results) => {
                resolve({err, results});
            });
        });
    },

    queryAssetsInfoByUUID(uuid) {
        return new Promise((resolve, reject) => {
            Editor.assetdb.queryInfoByUuid(Editor.Utils.UuidUtils.decompressUuid(uuid), function (err, result) {
                resolve({err, result});
            });
        });
    },

    queryUuidByUrl(url) {
        return new Promise((resolve, reject) => {
            Editor.assetdb.queryUuidByUrl(url, function (err, result) {
                resolve({err, result});
            });
        });
    },

    getObjectOfSceneByType(sceneObjects, type) {
        let tmp = [];
        for (let i = 0; i < sceneObjects.length; i++) {
            if (sceneObjects[i]["__type__"] == type) {
                tmp.push(sceneObjects[i]);
            }
        }
        return tmp;
    },

    getButtonsOfSceneByType(sceneObjects) {
        let tmp = [];
        for (let i = 0; i < sceneObjects.length; i++) {
            if (sceneObjects[i]["__type__"] == "cc.Button" && sceneObjects[i]["transition"] == 2) {
                tmp.push(sceneObjects[i]);
            }
        }
        return tmp;
    },

    getUUIDSprite(sprite) {
        return sprite["_spriteFrame"] ? sprite["_spriteFrame"]["__uuid__"] : null;
    },

    getRandomUUID() {
        return crypto.randomBytes(16).toString('hex');
    },

    getButtonUUID(button) {
        let buttonUUID = {};
        if (button.hoverSprite)
            buttonUUID.hoverSprite = {uuid: button.hoverSprite["__uuid__"], assetInfo: {}};
        if (button.pressedSprite)
            buttonUUID.pressedSprite = {uuid: button.pressedSprite["__uuid__"], assetInfo: {}};
        if (button["_N$hoverSprite"])
            buttonUUID._N$hoverSprite = {uuid: button["_N$hoverSprite"]['__uuid__'], assetInfo: {}};
        if (button["_N$normalSprite"])
            buttonUUID._N$normalSprite = {uuid: button["_N$normalSprite"]['__uuid__'], assetInfo: {}};
        if (button["_N$disabledSprite"])
            buttonUUID._N$disabledSprite = {uuid: button["_N$disabledSprite"]['__uuid__'], assetInfo: {}};
        if (button["_N$pressedSprite"])
            buttonUUID._N$pressedSprite = {uuid: button["_N$pressedSprite"]['__uuid__'], assetInfo: {}};
        return buttonUUID;
    },

    exportSpineOption(spine) {
        const {
            defaultAnimation,
            premultipliedAlpha,
            loop,
            _N$enableBatch,
            _N$_defaultCacheMode,
            defaultSkin,
            _N$useTint
        } = spine;
        let obj = {};
        obj.DefaultAnimation = defaultAnimation;
        obj.PremultiplyAlpha = premultipliedAlpha;
        obj.IsLoop = loop;
        obj.EnableBatch = _N$enableBatch;
        obj.AnimationCacheMode = 2;
        obj.defaultSkin = defaultSkin;
        obj.useTint = _N$useTint;
        return obj;
    },

    exportObjectTransform(sceneObjects, spine) {
        const nodeOfSpine = sceneObjects[spine.node["__id__"]];
        return {x: nodeOfSpine["_position"].x, y: nodeOfSpine["_position"].y,
            scaleX: nodeOfSpine["_scale"].x, scaleY: nodeOfSpine["_scale"].y
        }
    },


    async getGameAssetFolder(gameId) {
        let {results: assetsFolder} = await this.queryAssets("db://assets/**", "folder");
        for (let i = 0; i < assetsFolder.length; i++) {
            const folder = assetsFolder[i];
            let arrURL = folder.url.split("/");
            if (arrURL[arrURL.length - 1].indexOf(gameId) > -1) {
                return folder;
            }
        }
        return null;
    },

    async getSceneByGameFolder(gameFolder) {
        if (gameFolder) {
            let {results: sceneAsset} = await this.queryAssets(gameFolder.url + "/**", "scene");
            return sceneAsset;
        }
    },

    async getPrefabByGameFolder(gameFolder) {
        if (gameFolder) {
            let {results: sceneAsset} = await this.queryAssets(gameFolder.url + "/**", "prefab");
            return sceneAsset;
        }
    },

    escapeRegex(txt) {
        return txt.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    },


    urlToUUID(url) {
        return Editor.assetdb.remote.urlToUuid(url);
    },

    assetInfoByUUID(uuid) {
        return Editor.assetdb.remote.assetInfoByUuid(uuid);
    },

    assetInfoByPath(path) {
        return Editor.assetdb.remote.assetInfoByPath(path);
    },

    relaunch() {
        electron.remote.app.relaunch();
        electron.remote.app.quit();
    },
};

module.exports = Utils;