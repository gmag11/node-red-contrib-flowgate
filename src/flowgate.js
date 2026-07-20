module.exports = function (RED) {
    "use strict";

    // Shared node state setter (used by route and instances)
    function setNodeState(targetNode, state) {
        if (state) {
            targetNode.active = true;
            targetNode.status({ fill: "green", shape: "dot", text: "active" });
        } else {
            targetNode.active = false;
            targetNode.status({ fill: "grey", shape: "ring", text: "bypass" });
        }
    }

    // Register HTTP route once, outside the constructor
    RED.httpAdmin.post("/flowgate/:id/:state", RED.auth.needsPermission("flowgate.write"), function (req, res) {
        var state = req.params.state;
        if (state !== 'enable' && state !== 'disable') {
            res.sendStatus(404);
            return;
        }
        var targetNode = RED.nodes.getNode(req.params.id);
        // Verify target node is actually a flowgate
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

        // Node state (active or not)
        node.active = (config.active === null || typeof config.active === "undefined") || config.active;
        node.bypass = (config.bypass === null || typeof config.bypass === "undefined") || config.bypass;
        //node.name = config.name;

        // Ensure bypass/outputs consistency (import can desync)
        if (node.bypass && config.outputs !== 2) {
            node.warn("FlowGate: bypass enabled but outputs=" + config.outputs + ". Forcing outputs=2.");
        }

        setNodeState(this, this.active);

        // Message input event
        this.on("input", function (msg, send, done) {
            var node = this;

            // Control active state based on msg.flowgate
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
            //     done(); // End processing without sending the message
            //     return; // Exit the function
            // }

            // Forward message if node is active or bypass is enabled
            if (node.active) {
                send(msg); // Send message when node is active
            } else if (node.bypass) {
                // Guard: if outputs !== 2 (import desync), fall back to output 1
                if (node.outputs === 2 || (config.outputs === 2)) {
                    send([null, msg]); // Send message to bypass output
                } else {
                    send(msg);
                }
            }
            done(); // End processing
        });

        // Clear node status on close
        this.on("close", function () {
            node.status({});
        });
    }

    // Register the node in Node-RED
    // Button is managed in the editor (flowgate.html), not in runtime
    RED.nodes.registerType("flowgate", FlowGate);
};