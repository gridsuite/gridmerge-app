/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, {useEffect, useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {Redirect, Route, Switch, useHistory, useLocation, useRouteMatch,} from 'react-router-dom';

import {createMuiTheme, makeStyles, ThemeProvider} from "@material-ui/core/styles";
import CssBaseline from '@material-ui/core/CssBaseline';
import {initProcesses, LIGHT_THEME} from '../redux/actions';

import {
    AuthenticationRouter,
    getPreLoginPath,
    initializeAuthenticationProd,
    logout,
    TopBar,
} from '@gridsuite/commons-ui';
import {FormattedMessage} from 'react-intl';

import Process from './process';
import Parameters from './parameters';
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import {fetchMergeConfigs} from "./api";

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
    mapboxStyle: 'mapbox://styles/mapbox/light-v9',
});

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
    mapboxStyle: 'mapbox://styles/mapbox/dark-v9',
});

const getMuiTheme = (theme) => {
    if (theme === LIGHT_THEME) {
        return lightTheme;
    } else {
        return darkTheme;
    }
};

const useStyles = makeStyles(() => ({
    process: {
        marginLeft: 18,
    }
}));

const noUserManager = { instance: null, error: null };

const App = () => {

    const processes = useSelector(state => state.processes);

    const theme = useSelector(state => state.theme);

    const user = useSelector(state => state.user);

    const signInCallbackError = useSelector(state => state.signInCallbackError);

    const [userManager, setUserManager] = useState(noUserManager);

    const [showParameters, setShowParameters] = useState(false);

    const history = useHistory();

    const dispatch = useDispatch();

    const location = useLocation();

    const classes = useStyles();

    const [tabIndex, setTabIndex] = React.useState(0);

    let matchSilentRenewCallbackUrl= useRouteMatch({
        path: '/silent-renew-callback',
        exact: true,
    });

    useEffect(() => {
        initializeAuthenticationProd(
            dispatch,
            matchSilentRenewCallbackUrl != null,
            fetch('idpSettings.json')
        )
            .then((userManager) => {
                setUserManager({ instance: userManager, error: null });
                userManager.signinSilent();
            })
            .catch(function (error) {
                setUserManager({ instance: null, error: error.message });
                console.debug('error when importing the idp settings');
            });
    }, []);

    useEffect(() => {
        if (user !== null) {
            fetchMergeConfigs().then(configs => {
                dispatch(initProcesses(configs));
            });
        }
    }, [user]);

    function onLogoClicked() {
        history.replace("/");
    }

    function showParametersClicked() {
        setShowParameters(true);
    }

    function hideParameters() {
        setShowParameters(false);
    }

    return (
        <ThemeProvider theme={getMuiTheme(theme)}>
            <React.Fragment>
                <CssBaseline />
                <TopBar appName="Merge" appColor="#0CA789"
                        onParametersClick={() => showParametersClicked()}
                        onLogoutClick={() => logout(dispatch, userManager.instance)}
                        onLogoClick={() => onLogoClicked()} user={user}>
                    <Tabs
                        value={tabIndex}
                        indicatorColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                        onChange={(event, newValue) => setTabIndex(newValue)}
                        aria-label="parameters"
                        className={classes.process}>
                        { processes.map(process => <Tab label={process.name} />) }
                    </Tabs>
                </TopBar>
                <Parameters
                    showParameters={showParameters}
                    hideParameters={hideParameters}
                />
                { user !== null ? (
                        <Switch>
                            <Route exact path="/">
                                { processes.length > 0 && <Process process={processes[tabIndex]}/> }
                            </Route>
                            <Route exact path="/sign-in-callback">
                                <Redirect to={getPreLoginPath() || "/"} />
                            </Route>
                            <Route exact path="/logout-callback">
                                <h1>Error: logout failed; you are still logged in.</h1>
                            </Route>
                            <Route>
                                <h1><FormattedMessage id="PageNotFound"/> </h1>
                            </Route>
                        </Switch>)
                    : (
                        <AuthenticationRouter userManager={userManager} signInCallbackError={signInCallbackError} dispatch={dispatch} history={history} location={location}/>
                    )}
            </React.Fragment>
        </ThemeProvider>
    )
};

export default App;
