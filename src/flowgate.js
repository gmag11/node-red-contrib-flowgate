module.exports = function (RED) {
    "use strict";

    // Función para cambiar el estado del nodo (compartida por ruta e instancias)
    function setNodeState(targetNode, state) {
        if (state) {
            targetNode.active = true;
            targetNode.status({ fill: "green", shape: "dot", text: "active" });
        } else {
            targetNode.active = false;
            targetNode.status({ fill: "grey", shape: "ring", text: "bypass" });
        }
    }

    // Registrar la ruta HTTP una sola vez, fuera del constructor
    RED.httpAdmin.post("/flowgate/:id/:state", RED.auth.needsPermission("flowgate.write"), function (req, res) {
        var state = req.params.state;
        if (state !== 'enable' && state !== 'disable') {
            res.sendStatus(404);
            return;
        }
        var targetNode = RED.nodes.getNode(req.params.id);
        // Verificar que el nodo objetivo sea realmente un flowgate
        if (targetNode !== null && typeof targetNode !== "undefined" && targetNode.type === "flowgate") {
            setNodeState(targetNode, state === "enable");
            res.sendStatus(state === "enable" ? 200 : 201);
        } else {
            res.sendStatus(404);
        }
    });

    function FlowGate(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Estado del nodo, si está activo o no
        node.active = (config.active === null || typeof config.active === "undefined") || config.active;
        node.bypass = (config.bypass === null || typeof config.bypass === "undefined") || config.bypass;
        //node.name = config.name;

        // Asegurar consistencia entre bypass y outputs (import puede desincronizar)
        if (node.bypass && config.outputs !== 2) {
            node.warn("FlowGate: bypass habilitado pero outputs=" + config.outputs + ". Forzando outputs=2.");
        }

        setNodeState(this, this.active);

        // Evento de entrada de mensaje
        this.on("input", function (msg, send, done) {
            var node = this;

            // Controlar el estado activo basado en msg.flowgate
            if (msg.flowgate !== undefined) {
                var activeStates = [true, 1, "1", "ON", "On", "on", "yes"];
                var inactiveStates = [false, 0, "0", "OFF", "Off", "off", "no"];
                var recognized = true;

                if (typeof msg.flowgate === "string" && msg.flowgate.toLowerCase() === "toggle") {
                    node.active = !node.active;
                    setNodeState(node, node.active);
                } else if (activeStates.includes(msg.flowgate)) {
                    node.active = true;
                    setNodeState(node, true);
                } else if (inactiveStates.includes(msg.flowgate)) {
                    node.active = false;
                    setNodeState(node, false);
                } else {
                    recognized = false;
                }
                delete msg.flowgate;
                if (recognized) {
                    done();
                    return;
                }
                // Unrecognized value: warn and discard the message
                node.warn("FlowGate: unrecognized msg.flowgate — use true/false, 1/0, ON/OFF, or toggle");
                done();
                return;
            }

            // if (Object.keys(msg).length === 1 && msg._msgid !== undefined) {
            //     done(); // Finaliza el procesamiento sin enviar el mensaje
            //     return; // Salir de la función
            // }

            // Enviar mensaje si el nodo está activo o si bypass está habilitado
            if (node.active) {
                send(msg); // Enviar mensaje si el nodo está activo
            } else if (node.bypass) {
                // Guard: si outputs no es 2 (import desincronizado), enviar a salida 1
                if (node.outputs === 2 || (config.outputs === 2)) {
                    send([null, msg]); // Enviar mensaje a la bypass salida
                } else {
                    send(msg);
                }
            }
            done(); // Finalizar el procesamiento
        });

        // Evento para limpiar el estado cuando se cierra el nodo
        this.on("close", function () {
            node.status({});
        });
    }

    // Registrar el nodo en Node-RED
    // El botón se gestiona en el editor (flowgate.html), no en runtime
    RED.nodes.registerType("flowgate", FlowGate);
};