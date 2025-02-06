"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const config_1 = require("./config");
const generative_ai_1 = require("@google/generative-ai");
function activate(context) {
    let chatPanel;
    context.subscriptions.push(vscode.commands.registerCommand('aicoder.startChat', () => {
        chatPanel = vscode.window.createWebviewPanel('aiChat', 'AI Chat', vscode.ViewColumn.One, { enableScripts: true });
        // Load HTML content
        chatPanel.webview.html = getWebviewContent();
        // Handle messages from webview
        chatPanel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'sendMessage') {
                const response = await handleAIRequest(message.text);
                chatPanel?.webview.postMessage({
                    command: 'receiveMessage',
                    text: response
                });
            }
        }, undefined, context.subscriptions);
    }));
}
async function handleAIRequest(prompt) {
    const genAI = new generative_ai_1.GoogleGenerativeAI(config_1.API_KEYS.GEMINI);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
    catch (error) {
        return `Error: ${error}`;
    }
}
function getWebviewContent() {
    return `<!DOCTYPE html>
<html>
<head>
    <style>
        /* Add your chat styles here */
        #chat-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        #messages {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            border: 1px solid #ccc;
            margin-bottom: 10px;
        }
        .message {
            margin: 5px 0;
        }
        .user-message {
            text-align: right;
            color: blue;
        }
        .response-message {
            text-align: left;
            color: green;
        }
        #user-input {
            width: calc(100% - 80px);
            padding: 5px;
        }
        #send-btn {
            width: 70px;
            padding: 5px;
        }
    </style>
</head>
<body>
    <div id="chat-container">
        <div id="messages"></div>
        <input type="text" id="user-input" placeholder="Ask me anything...">
        <button id="send-btn">Send</button>
    </div>
    <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('send-btn').addEventListener('click', () => {
            const input = document.getElementById('user-input');
            const message = input.value;

            if (message.trim()) {
                addMessageToChat('user-message', message);
                vscode.postMessage({
                    command: 'sendMessage',
                    text: message
                });

                // Clear input
                input.value = '';
            }
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'receiveMessage') {
                addMessageToChat('response-message', message.text);
            }
        });

        function addMessageToChat(className, text) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${className}\`;
            messageDiv.textContent = text;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    </script>
</body>
</html>`;
}
//# sourceMappingURL=extension.js.map