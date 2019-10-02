const vscode = require('vscode');
const fs = require('fs');


const convert = {
	/**
	 * Convert settings.json file to valid JSON format, which firebase can use.
	 * VSCode uses speciel characters in the settings.json which are not accepted by firebase.
	 * e.g. [ ] . 
	 * @param {Object} settings VSCode Settings.json file
	 */
	settings2json: function (settings) {
		let settingsStr = settings.toString();
		settingsStr = settingsStr.replace(/[.]/g, ';');
		settingsStr = settingsStr.replace(/[[]/g, '-_');
		settingsStr = settingsStr.replace(/]/g, '_-');
		return settingsStr;
	},
	/**
	 * Convert backward, from firebase format to VSCode format.
	 * @param {String} json	Firebase realtime-database data. 
	 */
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
	// Start realtime-sync on VSCode start.
	vscode.commands.executeCommand('extension.startRealtimeSync');

	// Import firebase config file.
	let firebaseConfig = null;
	try {
		firebaseConfig = require('./firebase_config.js');
	} catch (err) {
		vscode.window.showErrorMessage("firebase config not found! (firebase_config.js)");
	}

	if (firebaseConfig) {
		let fb = require('firebase/app');
		require('firebase/database');
		let app = fb.initializeApp(firebaseConfig);
		let database = app.database().ref();

		// Prompts the user for set the path of VSCode settings.json
		let settingsjson_path = null;
		let setSettingsJsonPath = vscode.commands.registerCommand('extension.setSettingsJsonPath', function () {
			vscode.window.showInputBox().then(res => {
				settingsjson_path = res;
				try {
					fs.writeFile('path_save.txt', settingsjson_path, function() {
						console.log("Saved");
					});
				} catch (error) {
					console.log(error);
				}
				
			});
		})

		// Set realtime synch, and communication with firebase realtime database.
		let startRealtimeSync = vscode.commands.registerCommand('extension.startRealtimeSync', function () {
			if (!settingsjson_path) {
				vscode.window.showErrorMessage('Please set settings.json path, with "Set settins.json path" command.');
				return;
			}
			vscode.window.showInformationMessage('Real-time settings sync started!');
			database.on('value', function (snap) {
				fs.writeFile(settingsjson_path, convert.json2settings(snap), function (err) {
					console.log(err);
				});
			});
		});

		context.subscriptions.push(startRealtimeSync);
		context.subscriptions.push(setSettingsJsonPath);
	}
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
