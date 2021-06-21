import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import Label from '@material-ui/icons/Label';
import LocalOfferIcon from '@material-ui/icons/LocalOffer';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import { FormattedMessage } from 'react-intl';
import { Dialog, DialogContent } from '@material-ui/core';
import ReportItem from './report-item';

const useStyles = makeStyles({
    treeView: {
        height: '100%',
    },
    fullScreenIcon: {
        //bottom: 5,
        //right: 5,
        //position: 'absolute',
        cursor: 'pointer',
    },
});

export default function ReportViewer(props) {
    const classes = useStyles();
    const { title, open, onClose, report } = props;

    const idGenerator = (() => {
        let id = 1;
        return () => id++;
    })();

    const getColorReporterItem = (id) => {
        return id % 2 === 0 ? 'green' : 'red';
    };

    const fillTemplate = (templateString, templateVars) => {
        return templateString.replace(/\${([^{}]*)}/g, function (a, b) {
            let r = templateVars[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        });
    };

    const getFormattedMessage = (templateString, values) => {
        const templateVars = {};
        for (const [key, value] of Object.entries(values)) {
            templateVars[key] = value.value;
        }
        return fillTemplate(templateString, templateVars);
    };

    const createReporterItem = (value) => {
        let id = idGenerator();
        return (
            <ReportItem
                key={id.toString()}
                nodeId={id.toString()}
                labelIcon={Label}
                labelIconColor={getColorReporterItem(id)}
                labelText={getFormattedMessage(
                    value.defaultName,
                    value.taskValues
                )}
            >
                {value.reports
                    ? value.reports.map((value) => createReporItem(value))
                    : ''}
                {value.subReporters
                    ? value.subReporters.map((value) =>
                          createReporterItem(value)
                      )
                    : ''}
            </ReportItem>
        );
    };

    function createReporItem(value) {
        let id = idGenerator();
        return (
            <ReportItem
                key={id.toString()}
                nodeId={id.toString()}
                labelIcon={LocalOfferIcon}
                labelIconColor={null}
                labelText={
                    value.values.reportSeverity
                        ? value.values.reportSeverity.value
                        : 'UNKNOW'
                }
                labelInfo={getFormattedMessage(
                    value.defaultMessage,
                    value.values
                )}
            />
        );
    }

    const [fullScreen, setfullScreen] = React.useState(false);

    const showFullScreen = () => {
        setfullScreen(true);
    };

    const hideFullScreen = () => {
        setfullScreen(false);
    };

    return (
        <Dialog
            open={open}
            onClose={() => onClose()}
            fullScreen={fullScreen}
            aria-labelledby="dialog-title-report"
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <TreeView
                    className={classes.treeView}
                    defaultCollapseIcon={<ArrowDropDownIcon />}
                    defaultExpandIcon={<ArrowRightIcon />}
                    defaultEndIcon={<div style={{ width: 24 }} />}
                >
                    {report.subReporters.map((value) =>
                        createReporterItem(value)
                    )}
                </TreeView>
            </DialogContent>
            <DialogActions>
                {fullScreen ? (
                    <FullscreenExitIcon
                        onClick={hideFullScreen}
                        className={classes.fullScreenIcon}
                    />
                ) : (
                    <FullscreenIcon
                        onClick={showFullScreen}
                        className={classes.fullScreenIcon}
                    />
                )}
                <Button onClick={() => onClose()} variant="text">
                    <FormattedMessage id="close" />
                </Button>
            </DialogActions>
        </Dialog>
    );
}
