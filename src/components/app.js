/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, {useEffect, useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {Redirect, Route, Switch, useHistory, useLocation, useRouteMatch,} from 'react-router-dom';

import CssBaseline from '@material-ui/core/CssBaseline';
import {createMuiTheme, ThemeProvider} from '@material-ui/core/styles';
import {LIGHT_THEME} from '../redux/actions';

import {
    AuthenticationRouter,
    getPreLoginPath,
    initializeAuthenticationDev,
    initializeAuthenticationProd,
    logout,
    TopBar,
} from '@gridsuite/commons-ui';
import {FormattedMessage} from 'react-intl';

import MergeMap from './merge-map'
import Parameters from './parameters';

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

const noUserManager = { instance: null, error: null };

const App = () => {
    const theme = useSelector(state => state.theme);

    const user = useSelector(state => state.user);

    const signInCallbackError = useSelector(state => state.signInCallbackError);

    const [userManager, setUserManager] = useState(noUserManager);

    const [showParameters, setShowParameters] = useState(false);

    const history = useHistory();

    const dispatch = useDispatch();

    const location = useLocation();

    let matchSilentRenewCallbackUrl= useRouteMatch({
        path: '/silent-renew-callback',
        exact: true,
    });

    function initialize() {
        if (process.env.REACT_APP_USE_AUTHENTICATION === true) {
            return initializeAuthenticationProd(
                dispatch,
                matchSilentRenewCallbackUrl != null,
                fetch('idpSettings.json')
            );
        } else {
            return initializeAuthenticationDev(
                dispatch,
                matchSilentRenewCallbackUrl != null
            );
        }
    }

    useEffect(() => {
        initialize()
            .then((userManager) => {
                setUserManager({ instance: userManager, error: null });
                userManager.signinSilent();
            })
            .catch(function (error) {
                setUserManager({ instance: null, error: error.message });
                console.debug('error when importing the idp settings');
            });
    }, []);

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
                        onLogoClick={() => onLogoClicked()} user={user}/>
                <Parameters
                    showParameters={showParameters}
                    hideParameters={hideParameters}
                />
                { user !== null ? (
                        <Switch>
                            <Route exact path="/">
                                <MergeMap />
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
