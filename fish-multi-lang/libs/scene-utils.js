module.exports = {
    'check-scene-component': function (event, sceneUUID, nodePath, component) {
        if(sceneUUID && nodePath != null && component != null)
        {
            _Scene.loadSceneByUuid(sceneUUID, function (error) {
                let message = "";
                let compo = cc.require(component);
                if(!compo)
                {
                    message = `Không tìm thấy component ${component}`;
                }

                let node = cc.find(nodePath);
                if(!node)
                {
                    message = `Không tìm thấy node ${nodePath}`;
                }

                let instCompo = node.getComponent(compo);
                if(instCompo)
                {
                    message = `${component} đã được thêm sẵn vào node ${nodePath}`;
                }
                else
                {
                    node.addComponent(compo);
                    message = `${component} đã được thêm vào node ${nodePath} thành công`;
                    Editor.Ipc.sendToPanel('scene', 'scene:stash-and-save');
                }

                if (event.reply) {
                    event.reply(error, message);
                }
            });
        }
    }
};