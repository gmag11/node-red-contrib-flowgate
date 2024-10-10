module.exports = function (RED) {
    "use strict";

    function FlowGate(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Estado del nodo, si está activo o no
        this.active = (config.active === null || typeof config.active === "undefined") || config.active;
        this.name = config.name;

        // Lógica del botón en la interfaz
        RED.httpAdmin.post("/flowgate/:id/:state", RED.auth.needsPermission("flowgate.write"), function (req, res) {
            var state = req.params.state;
            if (state !== 'enable' && state !== 'disable') {
                res.sendStatus(404);
                return;
            }
            var targetNode = RED.nodes.getNode(req.params.id);
            if (targetNode !== null && typeof targetNode !== "undefined") {
                setNodeState(targetNode, state === "enable");
                res.sendStatus(state === "enable" ? 200 : 201);
            } else {
                res.sendStatus(404);
            }
        });

        // Función para cambiar el estado del nodo
        function setNodeState(targetNode, state) {
            if (state) {
                targetNode.active = true;
                targetNode.status({ fill: "green", shape: "dot", text: "active" });
            } else {
                targetNode.active = false;
                targetNode.status({ fill: "red", shape: "ring", text: "inactive" });
            }
        }

        setNodeState(this, this.active);

        // Evento de entrada de mensaje
        this.on("input", function (msg, send, done) {
            if (node.active) {
                send(msg); // Enviar mensaje si el nodo está activo
            }
            done(); // Finalizar el procesamiento
        });

        // Evento para limpiar el estado cuando se cierra el nodo
        this.on("close", function () {
            node.status({});
        });
    }

    // Registrar el nodo en Node-RED
    RED.nodes.registerType("flowgate", FlowGate, {
        settings: {
            flowgateUseColors: {
                value: true,
            }
        },
        button: {
            toggle: "active",
            visible: function () { return true; },
            onclick: function () {
                var node = this;
                var state = node.active ? "disable" : "enable";
                RED.httpAdmin.post(`/flowgate/${node.id}/${state}`, {}, function (err, res) {
                    if (!err && res.status === 200) {
                        node.active = !node.active;
                        node.status({
                            fill: node.active ? "green" : "red",
                            shape: node.active ? "dot" : "ring",
                            text: node.active ? "active" : "inactive"
                        });
                        RED.nodes.dirty(true);
                        RED.view.redraw();
                    }
                });
            }
        }
    });
};