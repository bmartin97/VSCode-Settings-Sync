const vscode = require('vscode');
const fs = require('fs');


const convert = {
	settings2json: function (settings) {
		let settingsStr = settings.toString();
		settingsStr = settingsStr.replace(/[.]/g, ';');
		settingsStr = settingsStr.replace(/[[]/g, '-_');
		settingsStr = settingsStr.replace(/]/g, '_-');
		return settingsStr;
	},
	json2settings: function (json) {
		let jsonStr = JSON.stringify(json);
		jsonStr = jsonStr.replace(/[;]/g, '.');
		jsonStr = jsonStr.replace(/-_/g, '[');
		jsonStr = jsonStr.replace(/_-/g, ']');
		return jsonStr;
	}
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Congratulations, your extension "vscode-settings-sync" is now active!');
	const firebaseConfig = require('./firebase_config.js');
	let fb = require('firebase/app');
	require('firebase/database');
	let app = fb.initializeApp(firebaseConfig);
	let database = app.database().ref();

	let settingsjson_path;


	let setSettingsJsonPath = vscode.commands.registerCommand('extension.setSettingsJsonPath', function() {
		vscode.window.showInputBox().then(res => {
			settingsjson_path = res;
		});
	})


	let startRealtimeSync = vscode.commands.registerCommand('extension.startRealtimeSync', function () {
		vscode.window.showInformationMessage('Real-time settings sync started!');
		try {
			database.on('value', function (snap) {
				fs.writeFile(settingsjson_path, convert.json2settings(snap), function (err) {
					console.log(err);
				});
			});
		} catch (error) {
			console.log(error);
		}
	});

	context.subscriptions.push(startRealtimeSync);
	context.subscriptions.push(setSettingsJsonPath);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
