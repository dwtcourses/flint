// src/components/DialogForm/DialogForm.tsx

import * as React from 'react';
import {withStyles, WithStyles, createStyles} from '@material-ui/core/styles';
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from '@material-ui/core/Button';
import {Simulate} from "react-dom/test-utils";
import submit = Simulate.submit;
import {LOADING_STATUS} from "../../constants";

const styles = createStyles({
    root: {

    },
});

type FormType = 'input' | 'select';

interface Form {
    type: FormType,
    key: string,
    label: string,
    placeholder?: string,
    helperText?: string,
    required?: boolean,
    defaultValue?: string|number,
    options: Array<string|number>
}

interface Params {
    [key: string]: string|number
}

interface Callback {
    setStatus: (status: LOADING_STATUS) => void,
    close: () => void,
}

export interface Props extends WithStyles<typeof styles> {
    open: boolean,
    onClose: () => void,
    title?: string,
    submitButtonTitle?: string,
    closeButtonTitle?: string,
    forms: Form[],
    onSubmit: (params: Params, callback: Callback) => void
}

interface State {
    params: Params,
    loadingStatus: LOADING_STATUS,
}

class DialogForm extends React.Component<Props, object> {
    state: State = {
        params: {},
        loadingStatus: LOADING_STATUS.NOT_STARTED
    };

    componentDidMount(): void {

    }

    onEnter = () => {

    };

    handleSetStatus = (loadingStatus: LOADING_STATUS) => {
        this.setState({loadingStatus});
    };

    handleSubmitButtonClick = () => {
        const {params} = this.state;
        const {onSubmit} = this.props;
        const callback = {setStatus: this.handleSetStatus, close: this.props.onClose};
        onSubmit(params, callback);
    };

    render() {
        const {classes, open, onClose, title, submitButtonTitle, closeButtonTitle, forms} = this.props;
        return (
            <div className={classes.root}>
                <Dialog
                    open={open}
                    onClose={onClose}
                    onEnter={this.onEnter}
                >
                    {!!title &&
                    <DialogTitle>{title}</DialogTitle>
                    }
                    <DialogContent>

                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={onClose}
                        >
                            {!!closeButtonTitle ? closeButtonTitle : 'Close'}
                        </Button>
                        <Button
                            variant={"contained"}
                            color={"primary"}
                            onClick={this.handleSubmitButtonClick}
                        >
                            {!!submitButtonTitle ? submitButtonTitle : 'Submit'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        )
    }
}

export default withStyles(styles)(DialogForm);