// src/containers/editorWindow/MVCEditor/UIEditorView/UIEditorView.tsx

import * as React from 'react';
import { withStyles, WithStyles, createStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { Dispatch } from "redux";
import {ConfigState, StoreState, UIEditorState} from "src/redux/state";
import * as actions from "src/redux/modules/editor/actions";
import UIEditor from "@flintdev/ui-editor";
import {
    ActionData,
    ComponentData,
    PerspectiveData,
    SettingsData,
    StateUpdaterData
} from "@flintdev/ui-editor/dist/interface";
import {ActionOperationType, StateUpdaterOperationType} from "@flintdev/ui-editor/dist/constants";
import AddWidgetDialog from "./AddWidgetDialog/AddWidgetDialog";
import {UIData, UIDataManager} from "../../../../controllers/ui/uiDataManager";
import * as componentsActions from "src/redux/modules/components/actions";
import {ToastType} from "../../../../components/interface";
import {OpenVSCodeCallback} from "@flintdev/ui-editor/dist/containers/Toolbar/StateActionsDialog/ActionsPane/ActionsPane";
import {shell} from 'electron';
import {UIActionHandler} from "../../../../controllers/ui/uiActionHandler";
import {MainProcessCommunicator} from "../../../../controllers/mainProcessCommunicator";
import {getWidget, getWidgetConfiguration, getWidgetInfo} from "../../../../controllers/ui/widgetLibraryWrapper";
import AddLibraryDialog from "./AddLibraryDialog/AddLibraryDialog";
import {PluginData} from "../../../../interface";

const styles = createStyles({
    root: {
        flexGrow: 1,
        display: 'flex',
        height: '100%',
        width: '100%',
        flexDirection: 'column',
    },
    content: {
        marginTop: 2,
        flexGrow: 1,
        backgroundColor: '#f5f5f5',
    },
});

export interface Props extends WithStyles<typeof styles>, UIEditorState, ConfigState {
    operations: any,
    addWidgetDialogOpen: () => void,
    toastOpen: (toastType: ToastType, message: string) => void,
}

interface State {
    actions: ActionData[],
    stateUpdaters: StateUpdaterData[],
    schemaEditorData: any,
    initialState: string,
    components: ComponentData[],
    settings: SettingsData,
    perspectives: PerspectiveData[],
    plugins: PluginData[],
}

class UIEditorView extends React.Component<Props, object> {
    state: State = {
        actions: [],
        stateUpdaters: [],
        schemaEditorData: undefined,
        initialState: '',
        components: [],
        settings: {},
        perspectives: [],
        plugins: []
    };
    operations: any = {};
    uiDataManager: UIDataManager;
    mainProcessCommunicator = new MainProcessCommunicator();
    componentDidMount(): void {
        this.props.operations.saveData = async () => {
            const data: UIData = {...this.state};
            await this.uiDataManager.saveUIData(data);
        };
        this.uiDataManager = new UIDataManager(this.props.projectDir);
        this.initActions().then(r => {});
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<object>, snapshot?: any): void {

    }

    initActions = async () => {
        const plugins: any = await new MainProcessCommunicator().getInstalledPlugins();
        this.setState({plugins});
        await this.uiDataManager.checkAndCreateUIDir();
        const data: UIData = await this.uiDataManager.getUIData();
        if (!data) return;
        this.setState({...data, plugins});
        const {components} = data;
        this.operations.updateComponents(components);
    };

    handleActionUpdate = (type: string, data: ActionData) => {
        let {actions} = this.state;
        if (type === ActionOperationType.Update) {
            const index = actions.findIndex(action => action.name === data.name);
            if (index > -1) {
                actions[index] = data;
                this.setState({actions});
            }
        } else if (type === ActionOperationType.Add) {
            actions.push(data);
            this.setState({actions});
        } else if (type === ActionOperationType.Delete) {
            const index = actions.findIndex(action => action.name === data.name);
            if (index > -1) {
                actions.splice(index, 1);
                this.setState({actions});
            }
        }
    };

    handleStateUpdatersOnUpdate = (type: string, data: StateUpdaterData) => {
        let {stateUpdaters} = this.state;
        if (type === StateUpdaterOperationType.Update) {
            const index = stateUpdaters.findIndex(updater => updater.name === data.name);
            if (index > -1) {
                stateUpdaters[index] = data;
                this.setState({stateUpdaters});
            }
        } else if (type === StateUpdaterOperationType.Add) {
            stateUpdaters.push(data);
            this.setState({stateUpdaters});
        } else if (type === StateUpdaterOperationType.Delete) {
            const index = stateUpdaters.findIndex(updater => updater.name === data.name);
            if (index > -1) {
                stateUpdaters.splice(index, 1);
                this.setState({stateUpdaters});
            }
        }
    };

    handleSchemaEditorDataUpdate = (schemaEditorData: any) => {
        this.setState({schemaEditorData});
    };

    handleInitialStateChange = (value: string) => {
        this.setState({initialState: value});
    };

    handleSettingsChange = (settings: SettingsData) => {
        this.setState({settings});
    };

    handlePerspectivesOnUpdate = (perspectives: PerspectiveData[]) => {
        this.setState({perspectives});
    };

    handleComponentsOnUpdate = (components: ComponentData[]) => {
        this.setState({components});
    };

    handleComponentOnSelect = (componentData: ComponentData) => {

    };

    saveButtonClick = async () => {
        const {projectDir} = this.props;
        const data: UIData = {...this.state};
        await this.uiDataManager.saveUIData(data);
        await this.mainProcessCommunicator.gitCommit(projectDir);
        this.props.toastOpen('success', 'UI data is saved successfully');
    };

    handleWidgetOnSelect = (data: ComponentData) => {
        this.operations.addComponent(data);
    };

    handleOpenVSCodeClick = (code: string, callback: OpenVSCodeCallback) => {
        const action = async () => {
            const uiActionHandler = new UIActionHandler();
            await uiActionHandler.writeToTempActionFile(code);
            await shell.openExternal(uiActionHandler.getVSCodeURL());
            new MainProcessCommunicator().waitingWindowBackToActive(() => {
                uiActionHandler.readTempActionFile().then(code => {
                    callback.backToActionEditor(code);
                });
            });
        };
        action().then(r => {});
    }

    render() {
        const {classes} = this.props;
        const {actions, stateUpdaters, schemaEditorData, initialState, components, settings, perspectives, plugins} = this.state;
        return (
            <div className={classes.root}>
                <div className={classes.content}>
                    <UIEditor
                        operations={this.operations}
                        plugins={plugins}
                        initialState={initialState}
                        stateUpdaters={stateUpdaters}
                        schemaEditorData={schemaEditorData}
                        schemaEditorDataOnUpdate={this.handleSchemaEditorDataUpdate}
                        initialStateOnChange={this.handleInitialStateChange}
                        stateUpdaterOnUpdate={this.handleStateUpdatersOnUpdate}
                        actions={actions}
                        actionOnUpdate={this.handleActionUpdate}
                        settings={settings}
                        settingsOnUpdate={this.handleSettingsChange}
                        perspectives={perspectives}
                        perspectivesOnUpdate={this.handlePerspectivesOnUpdate}
                        components={components}
                        componentsOnUpdate={this.handleComponentsOnUpdate}
                        componentOnSelect={this.handleComponentOnSelect}
                        saveOnClick={this.saveButtonClick}
                        handler={{
                            // @ts-ignore
                            getWidgetConfig: getWidgetConfiguration,
                            // @ts-ignore
                            getWidget: getWidget,
                            getWidgetInfo: getWidgetInfo,
                            // @ts-ignore
                            openVSCode: this.handleOpenVSCodeClick,
                        }}
                    />

                    <AddWidgetDialog
                        widgetOnSelect={this.handleWidgetOnSelect}
                    />
                    <AddLibraryDialog/>
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state: StoreState) => {
    return {...state.editor.uiEditor, ...state.config};
};

const mapDispatchToProps = (dispatch: Dispatch<actions.EditorAction|componentsActions.ComponentsAction>) => {
    return {
        addWidgetDialogOpen: () => dispatch(actions.uiEditor.addWidgetDialogOpen()),
        toastOpen: (toastType: ToastType, message: string) => dispatch(componentsActions.toastOpen(toastType, message)),

    }
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(UIEditorView));
