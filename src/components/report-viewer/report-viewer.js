/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useRef, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import Label from '@material-ui/icons/Label';
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
import LogReport from './log-report';
import { LogTable } from './log-table';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles({
    treeView: {
        height: '100%',
        overflow: 'scroll',
    },
    treeItem: {
        whiteSpace: 'nowrap',
    },
    fullScreenIcon: {
        cursor: 'pointer',
    },
    paperFullWidth: {
        height: '100%',
    },
});

export default function ReportViewer(props) {
    const classes = useStyles();
    const { title, open, onClose, jsonReport } = props;

    const [fullScreen, setFullScreen] = useState(false);

    const rootReport = useRef(new LogReport(jsonReport));

    const [logs, setLogs] = useState(rootReport.current.getAllLogs());

    const allReports = useRef({});

    const createReporterItem = (logReport) => {
        allReports.current[logReport.getId()] = logReport;
        return (
            <ReportItem
                key={logReport.getId().toString()}
                className={classes.treeItem}
                nodeId={logReport.getId().toString()}
                labelIcon={Label}
                labelIconColor={logReport.getHighestSeverity().color}
                labelText={logReport.getTitle()}
            >
                {logReport
                    .getSubReports()
                    .map((value) => createReporterItem(value))}
            </ReportItem>
        );
    };

    const showFullScreen = () => {
        setFullScreen(true);
    };

    const hideFullScreen = () => {
        setFullScreen(false);
    };

    const onNodeSelection = (event, nodeId) => {
        setLogs(allReports.current[nodeId].getAllLogs());
    };

    return (
        <Dialog
            open={open}
            onClose={() => onClose()}
            fullScreen={fullScreen}
            aria-labelledby="dialog-title-report"
            fullWidth={true}
            maxWidth="lg"
            classes={{
                paperFullWidth: classes.paperFullWidth,
            }}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent dividers={true}>
                <Grid container style={{ height: '100%' }}>
                    <Grid
                        item
                        xs={12}
                        sm={2}
                        style={{
                            height: '100%',
                            borderRight: '1px solid rgba(81, 81, 81, 1)',
                        }}
                    >
                        <TreeView
                            className={classes.treeView}
                            defaultCollapseIcon={<ArrowDropDownIcon />}
                            defaultExpandIcon={<ArrowRightIcon />}
                            defaultEndIcon={<div style={{ width: 24 }} />}
                            onNodeSelect={onNodeSelection}
                        >
                            {rootReport.current
                                .getSubReports()
                                .map((value) => createReporterItem(value))}
                        </TreeView>
                    </Grid>
                    <Grid item xs={12} sm={10} style={{ height: '100%' }}>
                        <LogTable logs={logs} />
                    </Grid>
                </Grid>
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
