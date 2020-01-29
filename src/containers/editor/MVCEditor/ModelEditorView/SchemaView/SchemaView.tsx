// src/containers/editor/MVCEditor/ModelEditorView/SchemaView/SchemaView.tsx

import * as React from 'react';
import {withStyles, WithStyles, createStyles} from '@material-ui/core/styles';
import {connect} from 'react-redux';
import {Dispatch} from "redux";
import {EditorState, StoreState} from "src/redux/state";
import * as actions from "src/redux/modules/editor/actions";
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CodeIcon from '@material-ui/icons/Code';
import Avatar from "@material-ui/core/Avatar";
import * as yaml from 'js-yaml';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/theme-monokai";

const styles = createStyles({
    root: {
        padding: 20,
        flexGrow: 1
    },
    card: {
        height: '100%',
        display: 'flex',
        flexFlow: 'column'
    },
    cardContent: {
        // paddingLeft: 20,
        // paddingRight: 20,
        flexGrow: 1
    }
});

export interface Props extends WithStyles<typeof styles>, EditorState {

}

class SchemaView extends React.Component<Props, object> {
    state = {};

    componentDidMount(): void {

    }

    codeEditorOnLoad = () => {

    };

    getCode = () => {
        const {modelEditor} = this.props;
        const {schemaData} = modelEditor;
        if (!schemaData) return '';
        const code = yaml.safeDump(schemaData, {
            'styles': {
                '!!null': 'canonical' // dump null as ~
            },
            'sortKeys': true
        });
        return code;
    };

    render() {
        const {classes, modelEditor} = this.props;
        const code = this.getCode();
        return (
            <div className={classes.root}>
                <Card className={classes.card}>
                    <CardHeader
                        avatar={<Avatar><CodeIcon/></Avatar>}
                        title={`Schema Viewer`}
                        subheader={`OpenAPI schema of data model`}
                    />
                    <CardContent className={classes.cardContent}>
                        <AceEditor
                            mode="yaml"
                            theme="monokai"
                            onLoad={this.codeEditorOnLoad}
                            fontSize={14}
                            value={code}
                            showPrintMargin={true}
                            showGutter={true}
                            highlightActiveLine={true}
                            style={{width: '100%', height: '100%'}}
                            readOnly={true}
                            setOptions={{
                                showLineNumbers: true,
                                tabSize: 2,
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        )
    }
}

const mapStateToProps = (state: StoreState) => {
    return state.editor;
};

const mapDispatchToProps = (dispatch: Dispatch<actions.EditorAction>) => {
    return {}
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(SchemaView));