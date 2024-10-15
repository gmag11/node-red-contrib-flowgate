# FlowGate Node for Node-RED

FlowGate is a custom node for [Node-RED](https://nodered.org/) that allows you to control the flow of messages through your automation workflows. It acts as an intelligent gate: when active, it lets messages pass; when inactive, it blocks messages from continuing through. This makes it easy to dynamically enable or disable parts of your Node-RED flows without requiring a deploy.

## Features

- **Two-State Toggle Button**: Control whether messages pass through or are blocked with a simple on/off button.
- **Runtime Control**: Change the state of FlowGate during runtime without redeploying your flows.
- **Intuitive UI Integration**: Visual representation of the node's state (active or inactive) directly within the Node-RED editor.
- **Bypass Output**: Enable a second output that allows messages to pass through even when the node is inactive.
- **Dynamic Activation**: Control the active state of the node using `msg.flowgate`. States may include values such as true, 1, "1", "ON", etc. to activate the node or their opposites to deactivate it.

## Installation

To install FlowGate in your Node-RED environment, use the following command:

```sh
npm install node-red-contrib-flowgate-node
```

Alternatively, you can install it directly from the Node-RED palette manager by searching for "FlowGate".

## Usage

1. Drag and drop the **FlowGate** node from the function category into your flow.
2. Configure the node as required:
   - **Name**: Set a name for the FlowGate instance to help identify it in your flows.
   - **Bypass**: If enabled, adds a second output for messages when the node is inactive.

3. Connect it to other nodes to control which messages should continue through based on its state.

The state of the node can be toggled during runtime without the need to redeploy the flow, making it flexible and easy to adjust.

![FlowGate Node](https://github.com/gmag11/node-red-contrib-flowgate/raw/main/assets/image.png)

## Example Use Cases

- **Conditional Message Flow**: Use FlowGate to enable or disable parts of your workflow for develpment, testing or debugging purposes.
- **Debugging Helper**: Isolate portions of a flow by disabling FlowGate to focus on troubleshooting other parts.

## Example Flow

Here is a simple example to demonstrate how to use FlowGate in a flow:

1. Add an **Inject** node to initiate a message.
2. Connect the **Inject** node to the **FlowGate** node.
3. Connect the **FlowGate** node to a **Debug** node to see the output.

When the **FlowGate** node is active, messages injected by the **Inject** node will pass through to the **Debug** node, allowing you to see the output. When the **FlowGate** node is inactive, the messages will be blocked, and nothing will reach the **Debug** node.

### Example Flow JSON

Below is the JSON representation of an example flow using FlowGate:

```json
[{"crontab": "", "id": "4f397f3a1bdaef61", "name": "", "once": false, "onceDelay": 0.1, "payload": "", "payloadType": "date", "props": [{"p": "payload"}], "repeat": "", "topic": "", "type": "inject", "wires": [["7cadca75dab0b34a"]], "x": 600, "y": 160, "z": "84c82b718b328987"}, {"active": true, "complete": "payload", "console": false, "id": "ee24781f808d8f1c", "name": "active", "statusType": "auto", "statusVal": "", "targetType": "msg", "tosidebar": true, "tostatus": false, "type": "debug", "wires": [], "x": 970, "y": 160, "z": "84c82b718b328987"}, {"active": true, "bypass": false, "id": "7cadca75dab0b34a", "name": "", "outputs": 1, "type": "flowgate", "wires": [["ee24781f808d8f1c"]], "x": 800, "y": 160, "z": "84c82b718b328987"}]
```

### Remark

It is not recommended to use this node in production environments as this breaks the Node-RED recommendation about [buttons](https://nodered.org/docs/creating-nodes/appearance#buttons)

## License

This project is licensed under the MIT License.

## Contribution

Feel free to fork the repository and submit pull requests. Contributions are always welcome to enhance the functionality and usability of FlowGate.

## Acknowledgements

FlowGate was inspired by the need to control Node-RED message flows easily during runtime. Special thanks to the Node-RED community for the tools and support.

---

For more information and documentation, visit the [Node-RED website](https://nodered.org/).
