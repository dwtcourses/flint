// src/controllers/pluginFileManager.ts

import {app} from 'electron';
import {FSHelper} from "./utils/fsHelper";
import * as progress from 'request-progress';
import {GithubHelper} from "./utils/githubHelper";
import * as request from 'request';
import * as fs from 'fs';
import {PluginData} from "../interface";
import {PluginRegistry} from "../constants";
import * as Mustache from "mustache";

const BUNDLE_FILE_NAME = 'plugin.js';

export class PluginFileManager {
    widgetsDirPath: string;
    configPath: string;
    pluginsRootPath: string;
    fsHelper: FSHelper = new FSHelper();
    githubHelper: GithubHelper = new GithubHelper();
    constructor() {
        this.pluginsRootPath = `${app.getPath('userData')}/plugins`;
        this.widgetsDirPath = `${app.getPath('userData')}/plugins/widgets`;
        this.configPath = `${app.getPath('userData')}/plugins/config.json`;

    }

    checkAndFetchPluginsConfig = async () => {
        const configJson = await this.getPluginsConfigJson();
        if (!configJson) {
            await this.reloadPluginsConfigFromRegistry();
        }
    };

    reloadPluginsConfigFromRegistry = async () => {
        // fetch plugins info from plugin-registry
        const {owner, repo, path} = PluginRegistry;
        const content = await this.githubHelper.getFileContent(owner, repo, path);
        await this.fsHelper.checkAndCreateDirWithWriteAccess(this.pluginsRootPath);
        await this.fsHelper.createFile(this.configPath, content);
    };

    getPluginsConfigJson = async () => {
        try {
            const content = await this.fsHelper.readFile(this.configPath);
            return JSON.parse(content);
        } catch (err) {
            return null;
        }
    }

    checkAndCreateRootDir = async () => {
        try {
            await this.fsHelper.checkAndCreateDirWithWriteAccess(this.widgetsDirPath);
        } catch (e) {
            console.log('create root dir', e);
        }
    };

    getUninstalledDependentPlugins = async (dependentPluginIdList: string[]) => {
        const configJson = await this.getPluginsConfigJson();
        let pluginDataMap: any = {};
        configJson.plugins.forEach((pluginData: any) => {
            const {id} = pluginData;
            pluginDataMap[id] = pluginData;
        });
        const installedPlugins = await this.getInstalledPlugins();
        let uninstalledPlugins = [];
        for (const pluginId of dependentPluginIdList) {
            let installed = false;
            for (const pluginData of installedPlugins) {
                if (pluginData.id === pluginId) installed = true;
            }
            if (!installed) {
                uninstalledPlugins.push(pluginDataMap[pluginId]);
            }
        }
        return uninstalledPlugins;
    };

    checkAvailableUpdatePerPlugin = async (pluginData: PluginData, version: string) => {
        const {owner, repo} = pluginData;
        const releaseInfo = await this.githubHelper.getLatestRelease(owner, repo);
        if (!!releaseInfo['tag_name'] && version !== releaseInfo['tag_name']) {
            return {
                currentVersion: version,
                newVersion: releaseInfo['tag_name']
            }
        } else {
            return false;
        }
    };

    downloadPluginWithoutProgress = async (pluginData: PluginData) => {
        return new Promise((resolve, reject) => {
            this.downloadPlugin(pluginData, {
                progress: (state: any) => {
                },
                error: (err: any) => {
                    reject(err);
                },
                success: () => {
                    resolve();
                }
            });
        });
    };

    downloadPlugin = (pluginData: PluginData, callback: any) => {
        const {id, name, owner, repo} = pluginData;
        this.createWidgetPluginDir(id).then(r => {
            this.githubHelper.getLatestRelease(owner, repo).then(releaseInfo => {
                const downloadURL = this.githubHelper.getAssetDownloadURL(owner, repo, releaseInfo, BUNDLE_FILE_NAME);
                progress(request(downloadURL), {})
                    .on('progress', (state: any) => {
                        callback.progress(state);
                    })
                    .on('error', (err: any) => {
                        callback.error(err);
                    })
                    .on('end', () => {
                        const version = releaseInfo['tag_name'];
                        this.updatePluginConfigFile(id, version).then(r => {
                            callback.success();
                        }).catch(err => {
                            callback.error(err);
                        });
                    })
                    .pipe(fs.createWriteStream(`${this.widgetsDirPath}/${id}/plugin.js`));
            }).catch(err => {
                callback.error('getLatestRelease', err);
            });
        }).catch(err => {
            callback.error('createWidgetPluginDir - err', err);
        });
    };

    removePlugin = async (plugin: PluginData) => {
        const path = `${this.widgetsDirPath}/${plugin.id}`;
        await this.fsHelper.removeDir(path);
    };

    checkForUpdates = async () => {
        const configJson = await this.getPluginsConfigJson();
        let pluginDataMap: any = {};
        configJson.plugins.forEach((pluginData: any) => {
            const {id} = pluginData;
            pluginDataMap[id] = pluginData;
        })
        const dirs = await this.fsHelper.readDir(this.widgetsDirPath);
        let pluginsWithNewUpdate: PluginData[] = [];
        for (const dir of dirs) {
            if (dir.type === "dir") {
                const id = dir.name;
                let pluginData = pluginDataMap[id];
                const version = await this.getCurrentVersion(id);
                const result = await this.checkAvailableUpdatePerPlugin(pluginData, version)
                if (!!result) {
                    pluginsWithNewUpdate.push({
                        ...pluginData,
                        ...result
                    })
                }
            }
        }
        return pluginsWithNewUpdate;
    };

    getInstalledPlugins = async () => {
        const configJson = await this.getPluginsConfigJson();
        let pluginDataMap: any = {};
        configJson.plugins.forEach((pluginData: any) => {
            const {id} = pluginData;
            pluginDataMap[id] = pluginData;
        })
        const dirs = this.fsHelper.readDirSync(this.widgetsDirPath);
        const filteredPluginIdList = [];
        for (const dir of dirs) {
            const validPlugin = await this.validatePluginDir(dir.name);
            if (dir.type === 'dir' && validPlugin) {
                filteredPluginIdList.push(dir.name);
            }
        }
        return filteredPluginIdList.map(pluginId => {
            return pluginDataMap[pluginId];
        })
    };

    private validatePluginDir = async (pluginId: string) => {
        const dirPath = `${this.widgetsDirPath}/${pluginId}`;
        const infoPath = `${dirPath}/info.json`;
        try {
            const content = await this.fsHelper.readFile(infoPath);
            const infoJson = JSON.parse(content);
            return !!infoJson && !!infoJson.version;
        } catch (e) {
            return false;
        }
    };

    preinstallPlugins = async () => {
        const configJson = await this.getPluginsConfigJson();
        await this.checkAndCreateRootDir();
        let dirs = await this.fsHelper.readDir(this.widgetsDirPath);
        dirs = dirs.filter(dir => dir.type === 'dir');
        if (dirs.length > 0) return;
        const plugins = configJson.plugins.filter((plugin: any) => !!plugin.preinstalled);
        for (const plugin of plugins) {
            try {
                await this.downloadPluginWithoutProgress(plugin);
            } catch (e) {
                console.log('download plugin', e);
            }
        }
    };

    renderHtmlTemplateWithPluginFiles = async (templateDir: string, templatePath: string) => {
        let dirs = await this.fsHelper.readDir(this.widgetsDirPath);
        dirs = dirs.filter(dir => dir.type === 'dir');
        const plugins = dirs.map(dir => {
            const id = dir.name;
            const path = `${this.widgetsDirPath}/${id}/plugin.js`;
            return {path};
        })
        const template = await this.fsHelper.readFile(templatePath);
        const htmlContent = Mustache.render(template, {plugins, dir: templateDir});
        const destPath = '/tmp/flint-editor.html';
        await this.fsHelper.createFile(destPath, htmlContent);
        return destPath;
    };

    private createWidgetPluginDir = async (id: string) => {
        const path = `${this.widgetsDirPath}/${id}`;
        await this.fsHelper.createDirByPath(path);
    };

    private updatePluginConfigFile = async (id: string, version: string) => {
        const path = `${this.widgetsDirPath}/${id}/info.json`;
        const data = {id, version};
        await this.fsHelper.createFile(path, JSON.stringify(data));
    }

    private getCurrentVersion = async (id: string) => {
        const path = `${this.widgetsDirPath}/${id}/info.json`;
        const content = await this.fsHelper.readFile(path);
        const info = JSON.parse(content);
        return info.version;
    };
}