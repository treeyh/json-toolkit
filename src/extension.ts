// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// 导入 vscode 模块，这是与 VSCode API 交互的入口
import * as vscode from 'vscode';
import * as ops from './json-ops';

function showMessage(message:string) {
	vscode.window.showErrorMessage(message);
}

function showInfoMessage(message:string) {
	vscode.window.showInformationMessage(message);
}

function getContent(): {error?: string, select?: boolean, content?: string, allContent?: string, editor?: vscode.TextEditor, range?: vscode.Range, allRange?: vscode.Range} {
	// 1. 获取当前活动的文本编辑器
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		// 如果没有打开的编辑器，就显示一条信息，然后退出
		return {error: 'There is currently no active editor window.'};
	}
	// 2. 获取用户的选择区域
	const selection = editor.selection;	
	// 3. 判断选择区域是否为空
	const content = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
	const allContent = editor.document.getText();
	// 确定要格式化的文本范围：如果是空的选区，则为整个文档；否则为选区本身。
	const allRange = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length));
	const range = selection.isEmpty 
		? allRange
		: selection;
	return {select: !selection.isEmpty, content: content, allContent: allContent, editor: editor, range: range, allRange: allRange};
}

function replaceContent(content: string, editor: vscode.TextEditor, range: vscode.Range) {
	// 使用 editor.edit() 来修改文档内容
	editor.edit(editBuilder => {
		// 用格式化后的文本替换掉原始范围内的文本
		editBuilder.replace(range, content);
	});
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
// 插件被激活时执行的函数
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "json-toolkit" is now active!');

	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// const disposable = vscode.commands.registerCommand('json-toolkit.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World from Json Toolkit!');
	// });

	// context.subscriptions.push(disposable);

	// 注册我们新定义的命令 'json-toolkit.validateJson'
	// registerCommand 会返回一个可释放的对象，我们把它放入 context.subscriptions 中
	// 这样当插件被禁用时，相关的资源可以被自动清理
	const validateCommand = vscode.commands.registerCommand('json-toolkit.validateJson', () => {
		const result = getContent();
		if (result.error !== undefined) {
			showMessage(result.error);
		}
		// 使用 try-catch 结构来判断是否为有效的 JSON
		try {
			if (!ops.isValidJson(result.content!)) {
				throw new Error('Invalid JSON');
			}
			
			// 根据是否有选择，给出更明确的提示信息
			const message = result.select ? '选中的文本是一个有效的JSON格式' : '文档是一个有效的JSON格式';
			showInfoMessage(message);
		} catch (error) {
			const message = result.select ? '选中的文本不是一个有效的JSON格式' : '文档内容不是一个有效的JSON格式';
			showMessage(message);
		}
	});

	// 注册我们新定义的命令 'json-toolkit.prettifyJson'
	// registerCommand 会返回一个可释放的对象，我们把它放入 context.subscriptions 中
	// 这样当插件被禁用时，相关的资源可以被自动清理
	const prettifyCommand = vscode.commands.registerCommand('json-toolkit.prettifyJson', () => {		
		// 获取当前活动的文本编辑器
		const result = getContent();
		if (result.error !== undefined) {
			showMessage(result.error);
		}
		// 使用 try-catch 结构来判断是否为有效的 JSON
		try {
			replaceContent(ops.prettify(result.content!), result.editor!, result.range!);
		} catch (error) {
			if (result.select) {
				try{
					replaceContent(ops.prettify(result.allContent!), result.editor!, result.allRange!);
				} catch (error) {
					showMessage('格式化失败：内容不是一个有效的JSON格式');
				}
			} else {
				showMessage('格式化失败：内容不是一个有效的JSON格式');
			}
		}
	});

	//================================================================
	// 3. 注册 Unescape JSON 命令 (新增的代码)
	//================================================================
	const unescapeJsonCommand = vscode.commands.registerCommand('json-toolkit.unescapeJson', () => {
		
		const result = getContent();
		if (result.error !== undefined) {
			showMessage(result.error);
		}

		try {
			replaceContent(ops.unescape(result.content!), result.editor!, result.range!);
		} catch (error) {
			if (result.select) {
				try{
					replaceContent(ops.unescape(result.allContent!), result.editor!, result.allRange!);
				} catch (error) {
					if (error instanceof Error && error.message === 'Unescaped value is not a string') {
						showMessage('去转义失败：内容是有效的JSON，但它不是一个需要去转义的字符串。');
						return;
					}
					showMessage('去转义失败：文本不是一个有效的、被转义的JSON字符串。');
				}
			} else {
				if (error instanceof Error && error.message === 'Unescaped value is not a string') {
					showMessage('去转义失败：内容是有效的JSON，但它不是一个需要去转义的字符串。');
					return;
				}
				showMessage('去转义失败：文本不是一个有效的、被转义的JSON字符串。');
			}
		}
	});


	//================================================================
	// 4. 注册 Escape JSON 命令 (新增的代码)
	//================================================================
	const escapeJsonCommand = vscode.commands.registerCommand('json-toolkit.escapeJson', () => {
		const result = getContent();
		if (result.error !== undefined) {
			showMessage(result.error);
		}

		try {
			replaceContent(ops.escape(result.content!), result.editor!, result.range!);

		} catch (error) {
			if (result.select) {
				try{
					replaceContent(ops.escape(result.allContent!), result.editor!, result.allRange!);
				} catch (error) {
					showMessage('转义失败：内容不是一个有效的JSON格式。');
				}
			} else {
				showMessage('转义失败：内容不是一个有效的JSON格式。');
			}
		}
	});

	//================================================================
	// 5. 注册 Compress JSON 命令 (新增的代码)
	//================================================================
	const minifyJsonCommand = vscode.commands.registerCommand('json-toolkit.minifyJson', () => {
		const result = getContent();
		if (result.error !== undefined) {
			showMessage(result.error);
		}

		try {
			replaceContent(ops.minify(result.content!), result.editor!, result.range!);
		} catch (error) {
			if (result.select) {
				try{
					replaceContent(ops.minify(result.content!), result.editor!, result.allRange!);
				} catch (error) {
					showMessage('压缩失败：内容不是一个有效的JSON格式。');
				}
			} else {
				showMessage('压缩失败：内容不是一个有效的JSON格式。');
			}
		}
	});

	//================================================================
	// 6. 注册 JSON to Unicode 命令 (新增的代码)
	//================================================================
	const jsonToUnicodeCommand = vscode.commands.registerCommand('json-toolkit.jsonToUnicode', () => {
		const result = getContent();
		if (result.error !== undefined) {
			showMessage(result.error);
		}

		try {
			replaceContent(ops.jsonToUnicode(result.content!), result.editor!, result.range!);
		} catch (error) {
			if (result.select) {
				try{
					replaceContent(ops.jsonToUnicode(result.allContent!), result.editor!, result.allRange!);
				} catch (error) {
					showMessage('转换为Unicode失败：内容不是一个有效的JSON格式。');
				}
			} else {
				showMessage('转换为Unicode失败：内容不是一个有效的JSON格式。');
			}
		}
	});


	//================================================================
	// 7. 注册 Unicode to JSON 命令 (新增的代码)
	//================================================================
	const unicodeToJsonCommand = vscode.commands.registerCommand('json-toolkit.unicodeToJson', () => {
		const result = getContent();
		if (result.error !== undefined) {
			showMessage(result.error);
		}

		try {
			replaceContent(ops.unicodeFromJson(result.content!), result.editor!, result.range!);
		} catch (error) {
			if (result.select) {
				try{
					replaceContent(ops.unicodeFromJson(result.allContent!), result.editor!, result.allRange!);
				} catch (error) {
					showMessage('从Unicode转换失败：内容不是一个有效的JSON格式。');
				}
			} else {
				showMessage('从Unicode转换失败：内容不是一个有效的JSON格式。');
			}
		}
	});

	//================================================================
	// 8. 注册 Sort JSON by Keys 命令 (新增的代码)
	//================================================================
	const sortJsonByKeyCommand = vscode.commands.registerCommand('json-toolkit.sortJsonByKey', () => {
		const result = getContent();
		if (result.error !== undefined) {
			showMessage(result.error);
		}

		try {
			replaceContent(ops.sortByKey(result.content!), result.editor!, result.range!);

		} catch (error) {
			if (result.select) {
				try{
					replaceContent(ops.sortByKey(result.allContent!), result.editor!, result.allRange!);
				} catch (error) {
					showMessage('排序失败：内容不是一个有效的JSON格式。');
				}
			} else {
				showMessage('排序失败：内容不是一个有效的JSON格式。');
			}
		}
	});


	// 将命令注册到插件的上下文中，确保其生命周期由 VSCode 管理
	context.subscriptions.push(validateCommand, prettifyCommand, minifyJsonCommand, unescapeJsonCommand, escapeJsonCommand, jsonToUnicodeCommand,
		unicodeToJsonCommand, sortJsonByKeyCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
