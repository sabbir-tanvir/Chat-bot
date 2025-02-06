import * as vscode from 'vscode';
import { API_KEYS } from './config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export function activate(context: vscode.ExtensionContext) {
    let chatPanel: vscode.WebviewPanel | undefined;

    context.subscriptions.push(
        vscode.commands.registerCommand('aicoder.startChat', () => {
            chatPanel = vscode.window.createWebviewPanel(
                'aiChat',
                'AI Chat',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            // Load HTML content
            chatPanel.webview.html = getWebviewContent();

            // Handle messages from webview
            chatPanel.webview.onDidReceiveMessage(
                async message => {
                    if (message.command === 'sendMessage') {
                        const response = await handleAIRequest(message.text);
                        chatPanel?.webview.postMessage({
                            command: 'receiveMessage',
                            text: response
                        });
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );
}

async function handleAIRequest(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(API_KEYS.GEMINI);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        return `Error: ${error}`;
    }
}

function getWebviewContent(): string {
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